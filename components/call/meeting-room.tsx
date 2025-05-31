"use client"

import { useState } from "react"
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, LayoutList } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type CallLayoutType = "grid" | "speaker-left" | "speaker-right"

const MeetingRoom = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPersonalRoom = !!searchParams.get("personal")
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left")
  const [showParticipants, setShowParticipants] = useState(false)
  const { useCallCallingState } = useCallStateHooks()

  const callingState = useCallCallingState()

  if (callingState !== CallingState.JOINED) return <CallLoader />

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />
      default:
        return <SpeakerLayout participantsBarPosition="right" />
    }
  }

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            "show-block": showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>
      {/* call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <Button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </Button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  )
}

const CallLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto"></div>
      </div>
      <p className="text-sky-600 font-medium">Joining call...</p>
    </div>
  </div>
)

const EndCallButton = () => {
  const router = useRouter()

  return (
    <Button onClick={() => router.push("/")} className="bg-red-500 hover:bg-red-600">
      End call for everyone
    </Button>
  )
}

export default MeetingRoom
