const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function fmtStage(s) {
  return {
    id: s.id,
    org_id: s.orgId,
    division_id: s.divisionId || null,
    name: s.name,
    description: s.description || null,
    order: s.order,
    is_active: s.isActive,
    created_by: s.createdBy,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    substages: (s.substages || []).map(fmtSubstage),
    division: s.division ? { id: s.division.id, name: s.division.name } : null,
  };
}

function fmtSubstage(sub) {
  return { id: sub.id, stage_id: sub.stageId, name: sub.name, order: sub.order };
}

class StageTemplateService {
  async list(orgId, { divisionId } = {}) {
    const where = { orgId };
    if (divisionId) where.divisionId = divisionId;
    const stages = await prisma.stageTemplate.findMany({
      where,
      include: {
        substages: { orderBy: { order: 'asc' } },
        division: { select: { id: true, name: true } },
      },
      orderBy: [{ divisionId: 'asc' }, { order: 'asc' }],
    });
    return stages.map(fmtStage);
  }

  async getById(orgId, stageId) {
    const s = await prisma.stageTemplate.findFirst({
      where: { id: stageId, orgId },
      include: {
        substages: { orderBy: { order: 'asc' } },
        division: { select: { id: true, name: true } },
      },
    });
    if (!s) throw ApiError.notFound('Stage template not found');
    return fmtStage(s);
  }

  async create(orgId, userId, data) {
    const { name, description, division_id, order = 0 } = data;
    if (!name?.trim()) throw ApiError.badRequest('Stage name is required');
    const s = await prisma.stageTemplate.create({
      data: {
        orgId,
        name: name.trim(),
        description: description?.trim() || null,
        divisionId: division_id || null,
        order: Number(order) || 0,
        isActive: true,
        createdBy: userId,
      },
      include: {
        substages: { orderBy: { order: 'asc' } },
        division: { select: { id: true, name: true } },
      },
    });
    return fmtStage(s);
  }

  async update(orgId, stageId, data) {
    await this.getById(orgId, stageId);
    const s = await prisma.stageTemplate.update({
      where: { id: stageId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.division_id !== undefined && { divisionId: data.division_id || null }),
        ...(data.order !== undefined && { order: Number(data.order) || 0 }),
        ...(data.is_active !== undefined && { isActive: Boolean(data.is_active) }),
      },
      include: {
        substages: { orderBy: { order: 'asc' } },
        division: { select: { id: true, name: true } },
      },
    });
    return fmtStage(s);
  }

  async delete(orgId, stageId) {
    await this.getById(orgId, stageId);
    await prisma.stageTemplate.delete({ where: { id: stageId } });
    return { success: true };
  }

  async createSubstage(orgId, stageId, data) {
    await this.getById(orgId, stageId);
    const { name, order } = data;
    if (!name?.trim()) throw ApiError.badRequest('Substage name is required');
    const maxOrder = await prisma.substageTemplate.aggregate({
      where: { stageId },
      _max: { order: true },
    });
    const nextOrder = order !== undefined ? Number(order) : (maxOrder._max.order ?? -1) + 1;
    const sub = await prisma.substageTemplate.create({
      data: { stageId, name: name.trim(), order: nextOrder },
    });
    return fmtSubstage(sub);
  }

  async updateSubstage(orgId, stageId, substageId, data) {
    await this.getById(orgId, stageId);
    const existing = await prisma.substageTemplate.findFirst({ where: { id: substageId, stageId } });
    if (!existing) throw ApiError.notFound('Substage not found');
    const sub = await prisma.substageTemplate.update({
      where: { id: substageId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.order !== undefined && { order: Number(data.order) }),
      },
    });
    return fmtSubstage(sub);
  }

  async deleteSubstage(orgId, stageId, substageId) {
    await this.getById(orgId, stageId);
    const existing = await prisma.substageTemplate.findFirst({ where: { id: substageId, stageId } });
    if (!existing) throw ApiError.notFound('Substage not found');
    await prisma.substageTemplate.delete({ where: { id: substageId } });
    return { success: true };
  }

  async bulkReplaceSubstages(orgId, stageId, substageNames) {
    await this.getById(orgId, stageId);
    await prisma.substageTemplate.deleteMany({ where: { stageId } });
    if (substageNames.length > 0) {
      await prisma.substageTemplate.createMany({
        data: substageNames.map((name, i) => ({ stageId, name: name.trim(), order: i })),
      });
    }
    return this.getById(orgId, stageId);
  }
}

module.exports = new StageTemplateService();
