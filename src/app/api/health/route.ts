import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    // Проверяем конфигурацию Supabase
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        status: 'warning',
        message: 'Supabase not configured',
        database: 'not_configured',
        timestamp: new Date().toISOString(),
        instructions: 'Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      })
    }

    // Проверяем подключение к Supabase
    if (!supabase) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase client not initialized',
        database: 'not_initialized',
        timestamp: new Date().toISOString()
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          database: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Discord Clone API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        database: 'unknown',
        error: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}