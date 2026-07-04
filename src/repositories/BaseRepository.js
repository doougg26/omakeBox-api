class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async update(where, data, options = {}) {
    return this.model.update(data, { where, ...options });
  }

  async delete(where, options = {}) {
    return this.model.destroy({ where, ...options });
  }

  async findOrCreate(where, defaults = {}) {
    return this.model.findOrCreate({ where, defaults });
  }
}

module.exports = BaseRepository;
