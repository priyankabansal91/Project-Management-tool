const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class VersioningService {
  /**
   * Create a version snapshot
   */
  async createVersion(orgId, entityType, entityId, data, userId, changeReason = null) {
    // Get current version count
    const lastVersion = await prisma.entityVersion.findFirst({
      where: { entityId, entityType },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;

    // Calculate changes if previous version exists
    let changes = null;
    if (lastVersion) {
      changes = this._calculateChanges(JSON.parse(lastVersion.data), data);
    }

    const version = await prisma.entityVersion.create({
      data: {
        orgId,
        entityType,
        entityId,
        version: nextVersion,
        data: JSON.stringify(data),
        changes: changes ? JSON.stringify(changes) : null,
        changedBy: userId,
        changeReason,
      },
    });

    return this._formatVersion(version);
  }

  /**
   * Get entity version history
   */
  async getHistory(orgId, entityType, entityId, { page = 1, page_size = 20 } = {}) {
    const [items, total] = await Promise.all([
      prisma.entityVersion.findMany({
        where: { orgId, entityType, entityId },
        orderBy: { version: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.entityVersion.count({
        where: { orgId, entityType, entityId },
      }),
    ]);

    return {
      items: items.map((v) => this._formatVersion(v)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Get specific version
   */
  async getVersion(orgId, entityType, entityId, version) {
    const versionRecord = await prisma.entityVersion.findFirst({
      where: { orgId, entityType, entityId, version },
    });

    if (!versionRecord) throw ApiError.notFound('Version not found');
    return this._formatVersion(versionRecord);
  }

  /**
   * Restore to specific version
   */
  async restoreVersion(orgId, entityType, entityId, version, userId) {
    const versionRecord = await prisma.entityVersion.findFirst({
      where: { orgId, entityType, entityId, version },
    });

    if (!versionRecord) throw ApiError.notFound('Version not found');

    const data = JSON.parse(versionRecord.data);

    // Create new version for the restore action
    await this.createVersion(orgId, entityType, entityId, data, userId, `Restored from version ${version}`);

    return { success: true, message: `Restored to version ${version}` };
  }

  /**
   * Compare two versions
   */
  async compareVersions(orgId, entityType, entityId, version1, version2) {
    const [v1, v2] = await Promise.all([
      prisma.entityVersion.findFirst({
        where: { orgId, entityType, entityId, version: version1 },
      }),
      prisma.entityVersion.findFirst({
        where: { orgId, entityType, entityId, version: version2 },
      }),
    ]);

    if (!v1 || !v2) throw ApiError.notFound('One or both versions not found');

    const data1 = JSON.parse(v1.data);
    const data2 = JSON.parse(v2.data);

    return {
      version1: {
        version: v1.version,
        data: data1,
        created_at: v1.createdAt,
      },
      version2: {
        version: v2.version,
        data: data2,
        created_at: v2.createdAt,
      },
      differences: this._calculateChanges(data1, data2),
    };
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(orgId, name, description, snapshotType, data, userId) {
    const snapshot = await prisma.snapshot.create({
      data: {
        orgId,
        name,
        description,
        snapshotType,
        data: JSON.stringify(data),
        createdBy: userId,
      },
    });

    return this._formatSnapshot(snapshot);
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshot(orgId, snapshotId) {
    const snapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, orgId },
    });

    if (!snapshot) throw ApiError.notFound('Snapshot not found');
    return this._formatSnapshot(snapshot);
  }

  /**
   * List snapshots
   */
  async listSnapshots(orgId, { snapshotType, page = 1, page_size = 20 } = {}) {
    const where = {
      orgId,
      ...(snapshotType && { snapshotType }),
    };

    const [items, total] = await Promise.all([
      prisma.snapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.snapshot.count({ where }),
    ]);

    return {
      items: items.map((s) => this._formatSnapshot(s)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(orgId, snapshotId) {
    const snapshot = await prisma.snapshot.findFirst({
      where: { id: snapshotId, orgId },
    });

    if (!snapshot) throw ApiError.notFound('Snapshot not found');

    await prisma.snapshot.delete({
      where: { id: snapshotId },
    });

    return { success: true };
  }

  /**
   * Calculate differences between two objects
   */
  _calculateChanges(oldData, newData) {
    const changes = {};

    // Check for modified and new fields
    Object.keys(newData).forEach((key) => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    });

    // Check for deleted fields
    Object.keys(oldData).forEach((key) => {
      if (!(key in newData)) {
        changes[key] = {
          old: oldData[key],
          new: null,
        };
      }
    });

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Format version for response
   */
  _formatVersion(version) {
    return {
      id: version.id,
      entity_type: version.entityType,
      entity_id: version.entityId,
      version: version.version,
      data: JSON.parse(version.data),
      changes: version.changes ? JSON.parse(version.changes) : null,
      changed_by: version.changedBy,
      change_reason: version.changeReason,
      created_at: version.createdAt,
    };
  }

  /**
   * Format snapshot for response
   */
  _formatSnapshot(snapshot) {
    return {
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      snapshot_type: snapshot.snapshotType,
      data: JSON.parse(snapshot.data),
      created_by: snapshot.createdBy,
      created_at: snapshot.createdAt,
    };
  }
}

module.exports = new VersioningService();
