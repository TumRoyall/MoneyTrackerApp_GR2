import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
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

export class EventRemoteDataSource {
  async getEvents(): Promise<Event[]> {
    const response = await httpClient.get<ApiResponse<Event[]>>('/api/events');
    return response.data.data;
  }

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const response = await httpClient.get<ApiResponse<EventDetail>>(`/api/events/${eventId}`);
    return response.data.data;
  }

  async createEvent(payload: CreateEventInput): Promise<Event> {
    const response = await httpClient.post<ApiResponse<Event>>('/api/events', payload);
    return response.data.data;
  }

  async updateEvent(eventId: string, payload: UpdateEventInput): Promise<Event> {
    const response = await httpClient.put<ApiResponse<Event>>(`/api/events/${eventId}`, payload);
    return response.data.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await httpClient.delete(`/api/events/${eventId}`);
  }

  async joinEvent(shareCode: string): Promise<Event> {
    const response = await httpClient.post<ApiResponse<Event>>(`/api/events/join`, {
      shareCode
    });
    return response.data.data;
  }

  async getGuestEventInfo(eventId: string): Promise<{ eventId: string, name: string, icon: string, status: string }> {
    const response = await httpClient.get<ApiResponse<{ eventId: string, name: string, icon: string, status: string }>>(`/api/events/${eventId}/guest-info`);
    return response.data.data;
  }

  async leaveEvent(eventId: string): Promise<void> {
    await httpClient.post(`/api/events/${eventId}/leave`);
  }

  async getEventMembers(eventId: string): Promise<EventMember[]> {
    const response = await httpClient.get<ApiResponse<EventMember[]>>(`/api/events/${eventId}/members`);
    return response.data.data;
  }

  async getEventTransactions(eventId: string): Promise<EventTransaction[]> {
    const response = await httpClient.get<ApiResponse<EventTransaction[]>>(`/api/events/${eventId}/transactions`);
    return response.data.data;
  }

  async addEventTransaction(eventId: string, payload: CreateEventTransactionInput): Promise<EventTransaction[]> {
    const response = await httpClient.post<ApiResponse<EventTransaction[]>>(
      `/api/events/${eventId}/transactions`,
      payload
    );
    return response.data.data;
  }

  async addGuestTransaction(eventId: string, payload: any): Promise<void> {
    // API endpoint dành cho khách (không yêu cầu Auth Header)
    await httpClient.post(`/api/events/${eventId}/guest-transactions`, payload);
  }

  async updateEventTransaction(
    eventId: string,
    transactionId: string,
    payload: UpdateEventTransactionInput
  ): Promise<EventTransaction> {
    const response = await httpClient.put<ApiResponse<EventTransaction>>(
      `/api/events/${eventId}/transactions/${transactionId}`,
      payload
    );
    return response.data.data;
  }

  async deleteEventTransaction(eventId: string, transactionId: string): Promise<void> {
    await httpClient.delete(`/api/events/${eventId}/transactions/${transactionId}`);
  }

  async getSettlement(eventId: string): Promise<Settlement> {
    const response = await httpClient.get<ApiResponse<Settlement>>(`/api/events/${eventId}/settlement`);
    return response.data.data;
  }

  async settleEvent(eventId: string): Promise<Settlement> {
    const response = await httpClient.post<ApiResponse<Settlement>>(`/api/events/${eventId}/settle`);
    return response.data.data;
  }
}

export const eventRemoteDataSource = new EventRemoteDataSource();