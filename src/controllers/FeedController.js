const feedService = require('../services/FeedService');

class FeedController {
  async getFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const posts = await feedService.getFeed(page);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async getPost(req, res, next) {
    try {
      const { postId } = req.params;
      const post = await feedService.getPostById(postId);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async createPost(req, res, next) {
    try {
      const post = await feedService.createPost(req.userId, req.validatedBody);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await feedService.deletePost(req.userId, postId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async likePost(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await feedService.likePost(req.userId, postId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addComment(req, res, next) {
    try {
      const { postId } = req.params;
      const { texto } = req.validatedBody;
      const post = await feedService.addComment(req.userId, postId, texto);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const posts = await feedService.getUserPosts(req.userId, page);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async getUserPostsByNickname(req, res, next) {
    try {
      const { nickname } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const posts = await feedService.getUserPostsByNickname(nickname, page);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeedController();
