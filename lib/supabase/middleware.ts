import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect /activation and /admin routes
  if (
    (pathname.startsWith('/activation') || pathname.startsWith('/admin')) &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based access control
  if (user) {
    const isAdmin = user.user_metadata?.is_admin === true

    // Prevent admins from accessing /activation
    if (pathname.startsWith('/activation') && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Prevent promoters from accessing /admin
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/activation'
      return NextResponse.redirect(url)
    }
  }

  // If logged in and visiting /login, redirect based on role
  if (pathname === '/login' && user) {
    const isAdmin = user.user_metadata?.is_admin === true
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/activation'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
