const connectionService = require('../services/ConnectionService');

class ConnectionController {
  async sendRequest(req, res, next) {
    try {
      const { userId: targetUserId } = req.params;
      const result = await connectionService.sendRequest(req.userId, targetUserId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req, res, next) {
    try {
      const { connectionId } = req.params;
      const result = await connectionService.acceptRequest(req.userId, connectionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeConnection(req, res, next) {
    try {
      const { connectionId } = req.params;
      const result = await connectionService.removeConnection(req.userId, connectionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getConnections(req, res, next) {
    try {
      const connections = await connectionService.getConnections(req.userId);
      res.json(connections);
    } catch (err) {
      next(err);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const requests = await connectionService.getPendingRequests(req.userId);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConnectionController();
