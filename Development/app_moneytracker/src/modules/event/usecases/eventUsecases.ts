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
  AddMemberInput,
  UpdateMemberInput,
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
    return await eventRemoteDataSource.joinEvent(shareCode);
  };

  const getGuestEventInfo = async (eventId: string) => {
    return await eventRemoteDataSource.getGuestEventInfo(eventId);
  };

  const leaveEvent = async (eventId: string): Promise<void> => {
    return eventRemoteDataSource.leaveEvent(eventId);
  };

  // ==================== MEMBERS ====================

  const getEventMembers = async (eventId: string): Promise<EventMember[]> => {
    return eventRemoteDataSource.getEventMembers(eventId);
  };

  const addMember = async (eventId: string, input: AddMemberInput): Promise<EventMember> => {
    return eventRemoteDataSource.addMember(eventId, input);
  };

  const updateMember = async (
    eventId: string,
    memberId: string,
    input: UpdateMemberInput
  ): Promise<EventMember> => {
    return eventRemoteDataSource.updateMember(eventId, memberId, input);
  };

  const removeMember = async (eventId: string, memberId: string): Promise<void> => {
    return eventRemoteDataSource.removeMember(eventId, memberId);
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

  const addGuestTransaction = async (eventId: string, payload: any): Promise<void> => {
    return eventRemoteDataSource.addGuestTransaction(eventId, payload);
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
    getGuestEventInfo,
    // Members
    getEventMembers,
    addMember,
    updateMember,
    removeMember,
    // Transactions
    getEventTransactions,
    addEventTransaction,
    addGuestTransaction,
    updateEventTransaction,
    deleteEventTransaction,
    // Settlement
    getSettlement,
    settleEvent,
  };
};