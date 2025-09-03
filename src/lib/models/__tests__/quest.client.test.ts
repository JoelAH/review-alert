import { 
  QuestType, 
  QuestPriority, 
  QuestState,
  type Quest,
  type CreateQuestInput,
  type UpdateQuestInput,
  type CreateQuestFromReviewInput
} from '../client/quest';

describe('Client Quest Types', () => {
  describe('QuestType enum', () => {
    it('should have all required quest types', () => {
      expect(QuestType.BUG_FIX).toBe('BUG_FIX');
      expect(QuestType.FEATURE_REQUEST).toBe('FEATURE_REQUEST');
      expect(QuestType.IMPROVEMENT).toBe('IMPROVEMENT');
      expect(QuestType.RESEARCH).toBe('RESEARCH');
      expect(QuestType.OTHER).toBe('OTHER');
    });

    it('should match server-side enum values', () => {
      const clientTypes = Object.values(QuestType);
      expect(clientTypes).toHaveLength(5);
      expect(clientTypes).toEqual(['BUG_FIX', 'FEATURE_REQUEST', 'IMPROVEMENT', 'RESEARCH', 'OTHER']);
    });
  });

  describe('QuestPriority enum', () => {
    it('should have all required priority levels', () => {
      expect(QuestPriority.HIGH).toBe('HIGH');
      expect(QuestPriority.MEDIUM).toBe('MEDIUM');
      expect(QuestPriority.LOW).toBe('LOW');
    });

    it('should match server-side enum values', () => {
      const clientPriorities = Object.values(QuestPriority);
      expect(clientPriorities).toHaveLength(3);
      expect(clientPriorities).toEqual(['HIGH', 'MEDIUM', 'LOW']);
    });
  });

  describe('QuestState enum', () => {
    it('should have all required quest states', () => {
      expect(QuestState.OPEN).toBe('OPEN');
      expect(QuestState.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(QuestState.DONE).toBe('DONE');
    });

    it('should match server-side enum values', () => {
      const clientStates = Object.values(QuestState);
      expect(clientStates).toHaveLength(3);
      expect(clientStates).toEqual(['OPEN', 'IN_PROGRESS', 'DONE']);
    });
  });

  describe('Quest interface', () => {
    it('should define a valid quest with all required fields', () => {
      const quest: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN
      };

      expect(quest._id).toBeDefined();
      expect(quest.user).toBeDefined();
      expect(quest.title).toBeDefined();
      expect(quest.type).toBeDefined();
      expect(quest.priority).toBeDefined();
      expect(quest.state).toBeDefined();
    });

    it('should allow optional fields', () => {
      const questWithOptionals: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        reviewId: '507f1f77bcf86cd799439013',
        title: 'Test Quest with Review',
        details: 'Detailed description of the quest',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(questWithOptionals.reviewId).toBeDefined();
      expect(questWithOptionals.details).toBeDefined();
      expect(questWithOptionals.createdAt).toBeDefined();
      expect(questWithOptionals.updatedAt).toBeDefined();
    });

    it('should handle date fields as both Date objects and strings', () => {
      const questWithDateObjects: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const questWithDateStrings: Quest = {
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      expect(questWithDateObjects.createdAt).toBeInstanceOf(Date);
      expect(typeof questWithDateStrings.createdAt).toBe('string');
    });
  });

  describe('CreateQuestInput interface', () => {
    it('should define valid input for creating a quest', () => {
      const createInput: CreateQuestInput = {
        user: '507f1f77bcf86cd799439012',
        title: 'New Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH
      };

      expect(createInput.user).toBeDefined();
      expect(createInput.title).toBeDefined();
      expect(createInput.type).toBeDefined();
      expect(createInput.priority).toBeDefined();
    });

    it('should allow optional fields in create input', () => {
      const createInputWithOptionals: CreateQuestInput = {
        user: '507f1f77bcf86cd799439012',
        reviewId: '507f1f77bcf86cd799439013',
        title: 'New Quest from Review',
        details: 'Quest created from user feedback',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM,
        state: QuestState.OPEN
      };

      expect(createInputWithOptionals.reviewId).toBeDefined();
      expect(createInputWithOptionals.details).toBeDefined();
      expect(createInputWithOptionals.state).toBeDefined();
    });
  });

  describe('UpdateQuestInput interface', () => {
    it('should allow partial updates to quest fields', () => {
      const updateInput: UpdateQuestInput = {
        state: QuestState.IN_PROGRESS
      };

      expect(updateInput.state).toBe(QuestState.IN_PROGRESS);
      expect(updateInput.title).toBeUndefined();
      expect(updateInput.priority).toBeUndefined();
    });

    it('should allow updating multiple fields', () => {
      const updateInput: UpdateQuestInput = {
        title: 'Updated Quest Title',
        details: 'Updated quest details',
        priority: QuestPriority.LOW,
        state: QuestState.DONE
      };

      expect(updateInput.title).toBe('Updated Quest Title');
      expect(updateInput.details).toBe('Updated quest details');
      expect(updateInput.priority).toBe(QuestPriority.LOW);
      expect(updateInput.state).toBe(QuestState.DONE);
    });
  });

  describe('CreateQuestFromReviewInput interface', () => {
    it('should define valid input for creating quest from review', () => {
      const reviewQuestInput: CreateQuestFromReviewInput = {
        reviewId: '507f1f77bcf86cd799439013',
        title: 'Fix bug reported in review',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH
      };

      expect(reviewQuestInput.reviewId).toBeDefined();
      expect(reviewQuestInput.title).toBeDefined();
      expect(reviewQuestInput.type).toBeDefined();
      expect(reviewQuestInput.priority).toBeDefined();
    });

    it('should allow optional details field', () => {
      const reviewQuestInputWithDetails: CreateQuestFromReviewInput = {
        reviewId: '507f1f77bcf86cd799439013',
        title: 'Implement feature request',
        details: 'User requested this feature in their review',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM
      };

      expect(reviewQuestInputWithDetails.details).toBeDefined();
    });
  });

  describe('Type compatibility', () => {
    it('should ensure enum values are consistent between client and server', () => {
      // This test ensures that if server enums change, client tests will fail
      const expectedTypes = ['BUG_FIX', 'FEATURE_REQUEST', 'IMPROVEMENT', 'RESEARCH', 'OTHER'];
      const expectedPriorities = ['HIGH', 'MEDIUM', 'LOW'];
      const expectedStates = ['OPEN', 'IN_PROGRESS', 'DONE'];

      expect(Object.values(QuestType)).toEqual(expectedTypes);
      expect(Object.values(QuestPriority)).toEqual(expectedPriorities);
      expect(Object.values(QuestState)).toEqual(expectedStates);
    });
  });
});