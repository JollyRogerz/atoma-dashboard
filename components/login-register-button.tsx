"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginRegisterModal } from "./login-register-modal"

export function LoginRegisterButton() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsLoginModalOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Login or Register
      </Button>
      <LoginRegisterModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}

