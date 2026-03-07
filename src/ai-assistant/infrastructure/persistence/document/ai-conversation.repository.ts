import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiConversation, AiMessage } from '../../../domain/ai-conversation';
import { AiConversationRepositoryAbstract } from './repositories/ai-conversation.repository.abstract';
import {
  AiConversationDocument,
  AiConversationDocumentType,
} from './schemas/ai-conversation.schema';
import { AiConversationMapper } from './mappers/ai-conversation.mapper';
import { NOT_DELETED } from '../../../../core/constants';

@Injectable()
export class AiConversationRepository extends AiConversationRepositoryAbstract {
  private readonly model: Model<AiConversationDocumentType>;
  private readonly mapper: AiConversationMapper;

  constructor(
    @InjectModel(AiConversationDocument.name)
    model: Model<AiConversationDocumentType>,
    mapper: AiConversationMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<AiConversation | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<[AiConversation[], number]> {
    const query = { userId, ...NOT_DELETED };
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  async create(conv: Partial<AiConversation>): Promise<AiConversation> {
    const doc = new this.model({
      ...this.mapper.toDocument(conv),
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(await doc.save());
  }

  async pushMessage(
    id: string,
    message: AiMessage,
    tokensUsed: number,
    model: string,
  ): Promise<AiConversation | null> {
    const updated = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        {
          $push: { messages: message },
          $inc: { totalTokensUsed: tokensUsed },
          $set: { lastModel: model },
        },
        { new: true },
      )
      .exec();
    return updated ? this.mapper.toDomain(updated) : null;
  }

  async updateTitle(id: string, title: string): Promise<AiConversation | null> {
    const updated = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { title } },
        { new: true },
      )
      .exec();
    return updated ? this.mapper.toDomain(updated) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      )
      .exec();
  }
}
