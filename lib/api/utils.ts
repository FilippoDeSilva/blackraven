import { NextResponse } from 'next/server';
import { z } from 'zod';

// Standardized success response for API routes
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// Standardized error response for API routes
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Middleware for request body validation in API routes
export function validateApiRequest<T extends z.ZodType>(schema: T) {
  return async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      // Attach validated data to the request if needed, or pass it directly to the handler
      // For now, we'll just ensure it's valid and the handler will re-parse/use it
      return NextResponse.json({ validatedData }); // This will be handled by the actual route handler
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[API Validation Error]', error.flatten().fieldErrors);
        return errorResponse('Invalid request data', 400);
      }
      console.error('[API Error]', error);
      return errorResponse('An unexpected server error occurred.', 500);
    }
  };
} 