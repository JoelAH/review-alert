import { 
  QuestType, 
  QuestPriority, 
  QuestState, 
  formatQuest,
  type Quest 
} from '../server/quest';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    pre: jest.fn()
  }));
  
  mockSchema.Types = {
    ObjectId: jest.fn()
  };
  
  return {
    Schema: mockSchema,
    model: jest.fn(),
    models: {},
    Types: {
      ObjectId: jest.fn()
    }
  };
});

describe('Quest Model', () => {
  describe('QuestType enum', () => {
    it('should have all required quest types', () => {
      expect(QuestType.BUG_FIX).toBe('BUG_FIX');
      expect(QuestType.FEATURE_REQUEST).toBe('FEATURE_REQUEST');
      expect(QuestType.IMPROVEMENT).toBe('IMPROVEMENT');
      expect(QuestType.RESEARCH).toBe('RESEARCH');
      expect(QuestType.OTHER).toBe('OTHER');
    });

    it('should have exactly 5 quest types', () => {
      const questTypes = Object.values(QuestType);
      expect(questTypes).toHaveLength(5);
    });
  });

  describe('QuestPriority enum', () => {
    it('should have all required priority levels', () => {
      expect(QuestPriority.HIGH).toBe('HIGH');
      expect(QuestPriority.MEDIUM).toBe('MEDIUM');
      expect(QuestPriority.LOW).toBe('LOW');
    });

    it('should have exactly 3 priority levels', () => {
      const priorities = Object.values(QuestPriority);
      expect(priorities).toHaveLength(3);
    });
  });

  describe('QuestState enum', () => {
    it('should have all required quest states', () => {
      expect(QuestState.OPEN).toBe('OPEN');
      expect(QuestState.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(QuestState.DONE).toBe('DONE');
    });

    it('should have exactly 3 quest states', () => {
      const states = Object.values(QuestState);
      expect(states).toHaveLength(3);
    });
  });

  describe('formatQuest function', () => {
    const mockObjectId = '507f1f77bcf86cd799439011';
    const mockUserObjectId = '507f1f77bcf86cd799439012';
    const mockReviewObjectId = '507f1f77bcf86cd799439013';

    const createMockQuestDocument = (questData: Partial<Quest> = {}) => ({
      toObject: jest.fn().mockReturnValue({
        _id: { toString: () => mockObjectId },
        user: { toString: () => mockUserObjectId },
        reviewId: questData.reviewId ? { toString: () => mockReviewObjectId } : undefined,
        title: 'Test Quest',
        details: 'Test quest details',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...questData
      })
    });

    it('should format quest document correctly', () => {
      const mockDocument = createMockQuestDocument();
      const formatted = formatQuest(mockDocument);

      expect(formatted._id).toBe(mockObjectId);
      expect(formatted.user).toBe(mockUserObjectId);
      expect(formatted.title).toBe('Test Quest');
      expect(formatted.details).toBe('Test quest details');
      expect(formatted.type).toBe(QuestType.BUG_FIX);
      expect(formatted.priority).toBe(QuestPriority.HIGH);
      expect(formatted.state).toBe(QuestState.OPEN);
    });

    it('should handle quest with reviewId', () => {
      const mockDocument = createMockQuestDocument({ reviewId: mockReviewObjectId });
      const formatted = formatQuest(mockDocument);

      expect(formatted.reviewId).toBe(mockReviewObjectId);
    });

    it('should handle quest without reviewId', () => {
      const mockDocument = createMockQuestDocument({ reviewId: undefined });
      const formatted = formatQuest(mockDocument);

      expect(formatted.reviewId).toBeUndefined();
    });

    it('should convert ObjectIds to strings', () => {
      const mockDocument = createMockQuestDocument();
      const formatted = formatQuest(mockDocument);

      expect(typeof formatted._id).toBe('string');
      expect(typeof formatted.user).toBe('string');
      expect(formatted._id).toBe(mockObjectId);
      expect(formatted.user).toBe(mockUserObjectId);
    });

    it('should preserve all quest properties', () => {
      const questData = {
        title: 'Custom Quest Title',
        details: 'Custom quest details',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.LOW,
        state: QuestState.IN_PROGRESS
      };

      const mockDocument = createMockQuestDocument(questData);
      const formatted = formatQuest(mockDocument);

      expect(formatted.title).toBe(questData.title);
      expect(formatted.details).toBe(questData.details);
      expect(formatted.type).toBe(questData.type);
      expect(formatted.priority).toBe(questData.priority);
      expect(formatted.state).toBe(questData.state);
    });

    it('should handle quest with minimal data', () => {
      const questData = {
        title: 'Minimal Quest',
        details: undefined,
        reviewId: undefined
      };

      const mockDocument = createMockQuestDocument(questData);
      const formatted = formatQuest(mockDocument);

      expect(formatted.title).toBe('Minimal Quest');
      expect(formatted.details).toBeUndefined();
      expect(formatted.reviewId).toBeUndefined();
    });
  });

  describe('Quest validation', () => {
    it('should validate required fields', () => {
      const validQuest: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN
      };

      // Basic type checking - TypeScript will catch missing required fields
      expect(validQuest.user).toBeDefined();
      expect(validQuest.title).toBeDefined();
      expect(validQuest.type).toBeDefined();
      expect(validQuest.priority).toBeDefined();
      expect(validQuest.state).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const questWithOptionalFields: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        details: undefined,
        reviewId: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };

      expect(questWithOptionalFields.details).toBeUndefined();
      expect(questWithOptionalFields.reviewId).toBeUndefined();
      expect(questWithOptionalFields.createdAt).toBeUndefined();
      expect(questWithOptionalFields.updatedAt).toBeUndefined();
    });

    it('should validate enum values', () => {
      // Test that enum values are properly defined
      expect(Object.values(QuestType)).toContain(QuestType.BUG_FIX);
      expect(Object.values(QuestPriority)).toContain(QuestPriority.HIGH);
      expect(Object.values(QuestState)).toContain(QuestState.OPEN);
    });
  });
});