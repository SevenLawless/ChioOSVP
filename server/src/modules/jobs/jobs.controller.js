const jobsService = require("./jobs.service");

async function getJobs(req, res) {
  const jobs = await jobsService.getJobs(req.query);

  res.json({
    ok: true,
    data: jobs
  });
}

async function getJobById(req, res) {
  const job = await jobsService.getJobById(req.params.id);

  if (!job) {
    res.status(404).json({
      ok: false,
      message: "Job application not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: job
  });
}

async function createJob(req, res) {
  const job = await jobsService.createJob(req.body);

  res.status(201).json({
    ok: true,
    message: "Job application created",
    data: job
  });
}

async function updateJob(req, res) {
  const job = await jobsService.updateJob(req.params.id, req.body);

  if (!job) {
    res.status(404).json({
      ok: false,
      message: "Job application not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Job application updated",
    data: job
  });
}

async function deleteJob(req, res) {
  const deleted = await jobsService.deleteJob(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Job application not found"
    });
    return;
  }

  res.json({
    ok: true,
    message: "Job application deleted"
  });
}

async function getJobStats(req, res) {
  const stats = await jobsService.getJobStats();

  res.json({
    ok: true,
    data: stats
  });
}

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobStats
};