import { eventRemoteDataSource } from '@/modules/event/api/eventRemoteDataSource';
import type {
  Event,
  EventDetail,
  EventMember,
  EventTransaction,
  Settlement,
  CreateEventInput,
  UpdateEventInput,
  CreateEventTransactionInput,
  UpdateEventTransactionInput,
} from '@/modules/event/models/event.types';

export const useEventUsecases = () => {
  // ==================== EVENT CRUD ====================

  const getEvents = async (): Promise<Event[]> => {
    return eventRemoteDataSource.getEvents();
  };

  const getEventDetail = async (eventId: string): Promise<EventDetail> => {
    return eventRemoteDataSource.getEventDetail(eventId);
  };

  const createEvent = async (input: CreateEventInput): Promise<Event> => {
    return eventRemoteDataSource.createEvent(input);
  };

  const updateEvent = async (eventId: string, input: UpdateEventInput): Promise<Event> => {
    return eventRemoteDataSource.updateEvent(eventId, input);
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    return eventRemoteDataSource.deleteEvent(eventId);
  };

  // ==================== JOIN / LEAVE ====================

  const joinEvent = async (shareCode: string): Promise<Event> => {
    return eventRemoteDataSource.joinEvent(shareCode);
  };

  const leaveEvent = async (eventId: string): Promise<void> => {
    return eventRemoteDataSource.leaveEvent(eventId);
  };

  // ==================== MEMBERS ====================

  const getEventMembers = async (eventId: string): Promise<EventMember[]> => {
    return eventRemoteDataSource.getEventMembers(eventId);
  };

  // ==================== TRANSACTIONS ====================

  const getEventTransactions = async (eventId: string): Promise<EventTransaction[]> => {
    return eventRemoteDataSource.getEventTransactions(eventId);
  };

  const addEventTransaction = async (
    eventId: string,
    input: CreateEventTransactionInput
  ): Promise<EventTransaction[]> => {
    return eventRemoteDataSource.addEventTransaction(eventId, input);
  };

  const updateEventTransaction = async (
    eventId: string,
    transactionId: string,
    input: UpdateEventTransactionInput
  ): Promise<EventTransaction> => {
    return eventRemoteDataSource.updateEventTransaction(eventId, transactionId, input);
  };

  const deleteEventTransaction = async (eventId: string, transactionId: string): Promise<void> => {
    return eventRemoteDataSource.deleteEventTransaction(eventId, transactionId);
  };

  // ==================== SETTLEMENT ====================

  const getSettlement = async (eventId: string): Promise<Settlement> => {
    return eventRemoteDataSource.getSettlement(eventId);
  };

  const settleEvent = async (eventId: string): Promise<Settlement> => {
    return eventRemoteDataSource.settleEvent(eventId);
  };

  return {
    // Event CRUD
    getEvents,
    getEventDetail,
    createEvent,
    updateEvent,
    deleteEvent,
    // Join/Leave
    joinEvent,
    leaveEvent,
    // Members
    getEventMembers,
    // Transactions
    getEventTransactions,
    addEventTransaction,
    updateEventTransaction,
    deleteEventTransaction,
    // Settlement
    getSettlement,
    settleEvent,
  };
};