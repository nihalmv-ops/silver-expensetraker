import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

/**
 * GET /api/events
 * Fetch all catering events sorted by date descending
 */
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1, updatedAt: -1 }).lean();
    return res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/:id
 * Fetch single event by custom string ID (e.g. EVT-2026-0001)
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.id }).lean();
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event by id:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events
 * Create or upsert an event
 */
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    if (!eventData.id || !eventData.name || !eventData.clientName) {
      return res.status(400).json({
        success: false,
        error: 'Event id, name, and clientName are required fields.',
      });
    }

    eventData.updatedAt = new Date().toISOString();
    if (!eventData.createdAt) {
      eventData.createdAt = eventData.updatedAt;
    }

    const savedEvent = await Event.findOneAndUpdate(
      { id: eventData.id },
      { $set: eventData },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({ success: true, data: savedEvent });
  } catch (error) {
    console.error('Error saving event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/events/:id
 * Update an existing event by custom ID
 */
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const updatedEvent = await Event.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ success: false, error: 'Event not found to update' });
    }

    return res.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event by custom ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Event not found to delete' });
    }
    return res.json({ success: true, message: `Event ${req.params.id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events/sync
 * Bulk sync & migration endpoint:
 * Receives local storage events, safely merges them with MongoDB,
 * preserving existing records and returning the unified list.
 */
router.post('/sync', async (req, res) => {
  try {
    const { events = [] } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ success: false, error: 'Expected "events" array' });
    }

    let syncedCount = 0;

    for (const localEvt of events) {
      if (!localEvt.id || !localEvt.name) continue;

      const existingInDb = await Event.findOne({ id: localEvt.id });

      if (!existingInDb) {
        // Not in database yet -> insert it safely
        await Event.create(localEvt);
        syncedCount++;
      } else {
        // Exists in database -> check if local version is newer
        const localUpdated = new Date(localEvt.updatedAt || 0).getTime();
        const dbUpdated = new Date(existingInDb.updatedAt || 0).getTime();

        if (localUpdated > dbUpdated) {
          await Event.findOneAndUpdate(
            { id: localEvt.id },
            { $set: localEvt },
            { new: true }
          );
          syncedCount++;
        }
      }
    }

    // Return the full, authoritative list of events from MongoDB
    const allEvents = await Event.find().sort({ date: -1, updatedAt: -1 }).lean();

    return res.json({
      success: true,
      syncedCount,
      totalCount: allEvents.length,
      data: allEvents,
    });
  } catch (error) {
    console.error('Error syncing events:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
