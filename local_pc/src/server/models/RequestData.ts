export interface RequestData {
    id: string;
    timestamp: number;
    content: {
      type: string;
      payload: any;
    };
    source: {
      ip: string;
      device: string;
    };
  }