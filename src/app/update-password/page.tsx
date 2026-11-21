import { updatePassword } from './actions'

export default function UpdatePasswordPage() {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-2xl font-bold mb-6 text-center">Enter New Password</h1>
        
        <label className="text-md" htmlFor="password">New Password</label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button
          formAction={updatePassword}
          className="bg-green-600 text-white rounded-md px-4 py-2 font-bold hover:bg-green-700 mb-2"
        >
          Update Password
        </button>
      </form>
    </div>
  )
}