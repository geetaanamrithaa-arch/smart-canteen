const QueueToken = require("../models/QueueToken");

const AVERAGE_SERVICE_TIME = 3;

const recalculateWaitingQueue = async () => {
  const waitingTokens = await QueueToken.find({ status: "waiting" }).sort({
    tokenNumber: 1,
  });

  for (let i = 0; i < waitingTokens.length; i++) {
    waitingTokens[i].estimatedWaitTime = i * AVERAGE_SERVICE_TIME;
    await waitingTokens[i].save();
  }
};

const joinQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const existingToken = await QueueToken.findOne({
      user: userId,
      status: "waiting",
    });

    if (existingToken) {
      return res.status(400).json({
        message: "You already have an active queue token",
        token: existingToken,
      });
    }

    const lastToken = await QueueToken.findOne().sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const peopleAhead = await QueueToken.countDocuments({
      status: "waiting",
    });

    const estimatedWaitTime = peopleAhead * AVERAGE_SERVICE_TIME;

    const newToken = await QueueToken.create({
      user: userId,
      name,
      role,
      tokenNumber: nextTokenNumber,
      estimatedWaitTime,
    });

    await recalculateWaitingQueue();

    res.status(201).json({
      message: "Joined queue successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("joinQueue error:", error);
    res.status(500).json({ message: "Server error while joining queue" });
  }
};

const getQueue = async (req, res) => {
  try {
    await recalculateWaitingQueue();

    const queueList = await QueueToken.find({ status: "waiting" })
      .sort({ tokenNumber: 1 })
      .populate("user", "name email role");

    res.status(200).json(queueList);
  } catch (error) {
    console.error("getQueue error:", error);
    res.status(500).json({ message: "Server error while fetching queue" });
  }
};

const updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["served", "cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either served or cancelled",
      });
    }

    const token = await QueueToken.findById(id);

    if (!token) {
      return res.status(404).json({ message: "Queue token not found" });
    }

    if (status === "cancelled" && req.user.role === "student") {
      if (token.user.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You can only cancel your own token",
        });
      }

      const createdTime = new Date(token.createdAt).getTime();
      const currentTime = new Date().getTime();
      const diffInMinutes = (currentTime - createdTime) / (1000 * 60);

      if (diffInMinutes > 1) {
        return res.status(403).json({
          message:
            "Cancellation allowed only within 1 minute of joining the queue",
        });
      }
    }

    token.status = status;
    await token.save();

    await recalculateWaitingQueue();

    res.status(200).json({
      message: `Queue token marked as ${status}`,
      token,
    });
  } catch (error) {
    console.error("updateQueueStatus error:", error);
    res.status(500).json({ message: "Server error while updating status" });
  }
};

module.exports = {
  joinQueue,
  getQueue,
  updateQueueStatus,
};