export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  lastLogin?: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
}

class AuthService {
  private currentUser: User | null = null
  private users: User[] = []
  private readonly STORAGE_KEY = 'cryptoquantix_users'
  private readonly CURRENT_USER_KEY = 'cryptoquantix_current_user'

  constructor() {
    this.loadUsers()
    this.loadCurrentUser()
  }

  private loadUsers(): void {
    const storedUsers = localStorage.getItem(this.STORAGE_KEY)
    if (storedUsers) {
      this.users = JSON.parse(storedUsers)
    } else {
      // Initialize with a demo user
      this.users = [
        {
          id: '1',
          email: 'demo@cryptoquantix.com',
          name: 'Demo User',
          createdAt: new Date(),
          lastLogin: new Date()
        }
      ]
      this.saveUsers()
    }
  }

  private saveUsers(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.users))
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem(this.CURRENT_USER_KEY)
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser)
    }
  }

  private saveCurrentUser(): void {
    if (this.currentUser) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser))
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY)
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    const { email, password } = credentials

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Find user by email
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Simple password validation (in production, this would be properly hashed)
    if (password !== 'demo123') {
      return { success: false, error: 'Invalid password' }
    }

    // Update last login
    user.lastLogin = new Date()
    this.saveUsers()

    // Set current user
    this.currentUser = user
    this.saveCurrentUser()

    return { success: true, user }
  }

  async signup(credentials: SignupCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    const { name, email, password, confirmPassword } = credentials

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Validate inputs
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' }
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email is required' }
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' }
    }

    // Check if user already exists
    const existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      name: name.trim(),
      createdAt: new Date(),
      lastLogin: new Date()
    }

    this.users.push(newUser)
    this.saveUsers()

    // Set current user
    this.currentUser = newUser
    this.saveCurrentUser()

    return { success: true, user: newUser }
  }

  logout(): void {
    this.currentUser = null
    this.saveCurrentUser()
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return { success: false, message: 'If an account with that email exists, a reset link has been sent.' }
    }

    // In production, this would send an email
    return { success: true, message: 'If an account with that email exists, a reset link has been sent.' }
  }
}

export const authService = new AuthService()
