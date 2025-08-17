import * as React from "react"

export function Toaster() {
  return <div id="toaster-container" />
}

export function useToast() {
  return {
    toast: ({ title, description }: { title?: string; description?: string }) => {
      console.log("Toast:", { title, description })
    }
  }
}
