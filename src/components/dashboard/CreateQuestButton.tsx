'use client';

import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Review, ReviewQuest } from '@/lib/models/client/review';
import { QuestType, QuestPriority } from '@/lib/models/client/quest';
import QuestModal, { CreateQuestData } from './QuestModal';

export interface CreateQuestButtonProps {
  review: Review;
  onQuestCreated?: (questId: string) => void;
  disabled?: boolean;
}

// Helper function to map review quest type to quest type
const mapReviewQuestToQuestType = (reviewQuest?: ReviewQuest): QuestType => {
  switch (reviewQuest) {
    case ReviewQuest.BUG:
      return QuestType.BUG_FIX;
    case ReviewQuest.FEATURE_REQUEST:
      return QuestType.FEATURE_REQUEST;
    case ReviewQuest.OTHER:
    default:
      return QuestType.IMPROVEMENT;
  }
};

// Helper function to map review priority to quest priority
const mapReviewPriorityToQuestPriority = (reviewPriority?: string): QuestPriority => {
  switch (reviewPriority) {
    case 'HIGH':
      return QuestPriority.HIGH;
    case 'MEDIUM':
      return QuestPriority.MEDIUM;
    case 'LOW':
      return QuestPriority.LOW;
    default:
      return QuestPriority.MEDIUM;
  }
};

const CreateQuestButton: React.FC<CreateQuestButtonProps> = ({
  review,
  onQuestCreated,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Check if quest already exists for this review
  const questAlreadyExists = Boolean(review.questId);

  const handleOpenModal = () => {
    if (!questAlreadyExists && !disabled) {
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCreateQuest = async (questData: CreateQuestData) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        throw new Error('Failed to create quest');
      }

      const result = await response.json();
      const createdQuest = result.quest;

      onQuestCreated?.(createdQuest._id);
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setIsCreating(false);
    }
  };

  // Pre-populate quest data from review
  const getInitialQuestData = (): Partial<CreateQuestData> => {
    return {
      title: `Review: ${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}`,
      details: `From review by ${review.name}:\n\n"${review.comment}"\n\nRating: ${review.rating}/5 stars`,
      type: mapReviewQuestToQuestType(review.quest),
      priority: mapReviewPriorityToQuestPriority(review.priority),
      reviewId: review._id,
    };
  };

  const isButtonDisabled = disabled || questAlreadyExists || isCreating;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          isCreating ? (
            <CircularProgress size={16} />
          ) : (
            <AddIcon />
          )
        }
        onClick={handleOpenModal}
        disabled={isButtonDisabled}
        sx={{
          minWidth: 'auto',
          px: 1.5,
          py: 0.5,
          fontSize: '0.75rem',
          textTransform: 'none',
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'white',
          },
        }}
      >
        {questAlreadyExists ? 'Quest Created' : 'Create Quest'}
      </Button>

      <QuestModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateQuest}
        initialData={getInitialQuestData()}
        mode="create"
      />
    </>
  );
};

export default CreateQuestButton;