const gymService = require("./gym.service");

async function getSessions(req, res) {
  const sessions = await gymService.getSessions();

  res.json({
    ok: true,
    data: sessions
  });
}

async function getSessionById(req, res) {
  const session = await gymService.getSessionById(req.params.id);

  if (!session) {
    res.status(404).json({
      ok: false,
      message: "Workout session not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: session
  });
}

async function createSession(req, res) {
  const session = await gymService.createSession(req.body);

  res.status(201).json({
    ok: true,
    message: "Workout session created",
    data: session
  });
}

async function updateSession(req, res) {
  const session = await gymService.updateSession(req.params.id, req.body);

  if (!session) {
    res.status(404).json({
      ok: false,
      message: "Workout session not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Workout session updated",
    data: session
  });
}

async function deleteSession(req, res) {
  const deleted = await gymService.deleteSession(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Workout session not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Workout session deleted"
  });
}

async function addExercise(req, res) {
  const exercise = await gymService.addExercise(
    req.params.sessionId,
    req.body
  );

  res.status(201).json({
    ok: true,
    message: "Exercise added",
    data: exercise
  });
}

async function updateExercise(req, res) {
  const exercise = await gymService.updateExercise(req.params.id, req.body);

  if (!exercise) {
    res.status(404).json({
      ok: false,
      message: "Exercise not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Exercise updated",
    data: exercise
  });
}

async function deleteExercise(req, res) {
  const deleted = await gymService.deleteExercise(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Exercise not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Exercise deleted"
  });
}

async function addSet(req, res) {
  const set = await gymService.addSet(
    req.params.exerciseId,
    req.body
  );

  res.status(201).json({
    ok: true,
    message: "Set added",
    data: set
  });
}

async function updateSet(req, res) {
  const set = await gymService.updateSet(req.params.id, req.body);

  if (!set) {
    res.status(404).json({
      ok: false,
      message: "Set not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Set updated",
    data: set
  });
}

async function deleteSet(req, res) {
  const deleted = await gymService.deleteSet(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Set not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Set deleted"
  });
}

async function getProgress(req, res) {
  const progress = await gymService.getProgress(req.query);

  res.json({
    ok: true,
    data: progress
  });
}

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addExercise,
  updateExercise,
  deleteExercise,
  addSet,
  updateSet,
  deleteSet,
  getProgress
};