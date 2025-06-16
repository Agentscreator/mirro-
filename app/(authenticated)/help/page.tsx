"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Book,
  Shield,
  Heart,
  Users,
  Settings,
  CreditCard,
  Bug,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: Book,
    questions: [
      {
        question: "How do I create my profile?",
        answer:
          "To create your profile, go to your profile page and tap the edit button. Add photos, write about yourself, and select your interests and preferences to help us find better matches for you.",
      },
      {
        question: "How does the matching algorithm work?",
        answer:
          "Our algorithm considers your interests, location preferences, age range, and activity patterns to suggest compatible connections. The more you use the app, the better our recommendations become.",
      },
      {
        question: "What are thoughts and how do I use them?",
        answer:
          "Thoughts are personal notes you can add to your profile to share your perspectives and experiences. They help others understand your personality and create more meaningful connections.",
      },
    ],
  },
  {
    id: "connections",
    name: "Connections & Messaging",
    icon: Heart,
    questions: [
      {
        question: "How do I start a conversation?",
        answer:
          "You can start a conversation by visiting someone's profile and tapping the message button. You can also message people you've matched with from the discover page.",
      },
      {
        question: "Can I video call other users?",
        answer:
          "Yes! Once you're connected with someone, you can start video or audio calls directly from the chat interface. This helps you get to know each other better.",
      },
      {
        question: "How do I know if someone is interested?",
        answer:
          "You'll receive notifications when someone likes your posts or sends you a message. Premium users can also see who has viewed their profile.",
      },
    ],
  },
  {
    id: "privacy",
    name: "Privacy & Safety",
    icon: Shield,
    questions: [
      {
        question: "How do you protect my privacy?",
        answer:
          "We take privacy seriously. Your personal information is encrypted, and you control what information is visible to others. You can block or report users who make you uncomfortable.",
      },
      {
        question: "Can I control who sees my profile?",
        answer:
          "Yes, you can adjust your privacy settings to control who can see your profile and contact you. You can also set your profile to private mode.",
      },
      {
        question: "How do I report inappropriate behavior?",
        answer:
          "You can report users by going to their profile and selecting 'Report User'. We review all reports promptly and take appropriate action.",
      },
    ],
  },
  {
    id: "account",
    name: "Account & Settings",
    icon: Settings,
    questions: [
      {
        question: "How do I change my notification settings?",
        answer:
          "Go to Settings > Notifications to customize which notifications you receive and how you receive them (push, email, or both).",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can delete your account from Settings > Account > Delete Account. This action is permanent and cannot be undone.",
      },
      {
        question: "How do I change my location?",
        answer:
          "Your location is automatically detected, but you can manually set it in Settings > Location. This affects who you see in your recommendations.",
      },
    ],
  },
  {
    id: "billing",
    name: "Billing & Subscriptions",
    icon: CreditCard,
    questions: [
      {
        question: "What's included in Premium?",
        answer:
          "Premium includes unlimited connections, advanced matching, priority messaging, see who liked you, advanced filters, and more features to enhance your experience.",
      },
      {
        question: "How do I cancel my subscription?",
        answer:
          "You can cancel your subscription from Settings > Plan & Billing > Cancel Subscription. You'll retain access until the end of your billing period.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "Refunds are handled on a case-by-case basis. Please contact our support team with your request and we'll review it promptly.",
      },
    ],
  },
]

const CONTACT_OPTIONS = [
  {
    id: "chat",
    name: "Live Chat",
    description: "Get instant help from our support team",
    icon: MessageCircle,
    available: "24/7",
    action: "Start Chat",
  },
  {
    id: "email",
    name: "Email Support",
    description: "Send us a detailed message",
    icon: Mail,
    available: "Response within 24h",
    action: "Send Email",
  },
  {
    id: "phone",
    name: "Phone Support",
    description: "Speak directly with our team",
    icon: Phone,
    available: "Mon-Fri 9AM-6PM EST",
    action: "Call Now",
  },
]

export default function HelpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [openCategories, setOpenCategories] = useState<string[]>(["getting-started"])
  const [contactForm, setContactForm] = useState({
    subject: "",
    category: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const filteredFAQs = FAQ_CATEGORIES.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((category) => category.questions.length > 0)

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.subject || !contactForm.category || !contactForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      })

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: "We've received your message and will respond within 24 hours.",
        })
        setContactForm({ subject: "", category: "", message: "" })
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:bg-blue-50 text-blue-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Help & Support</h1>
      </div>

      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTACT_OPTIONS.map((option) => (
            <Card key={option.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <option.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{option.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                <Badge variant="secondary" className="mb-4">
                  {option.available}
                </Badge>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">{option.action}</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {(searchQuery ? filteredFAQs : FAQ_CATEGORIES).map((category) => (
              <Card key={category.id}>
                <Collapsible
                  open={openCategories.includes(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <category.icon className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant="secondary">{category.questions.length}</Badge>
                        </div>
                        {openCategories.includes(category.id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {category.questions.map((faq, index) => (
                          <div key={index} className="border-l-2 border-blue-100 pl-4">
                            <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message and we'll help you out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={contactForm.category}
                    onValueChange={(value) => setContactForm((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="technical">Technical Problems</SelectItem>
                      <SelectItem value="safety">Safety & Privacy</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Please describe your issue in detail..."
                  className="min-h-[120px]"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Book className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">User Guide</div>
                    <div className="text-sm text-gray-600">Complete guide to using Mirro</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Community Forum</div>
                    <div className="text-sm text-gray-600">Connect with other users</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Bug className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Report a Bug</div>
                    <div className="text-sm text-gray-600">Help us improve the app</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Feature Requests</div>
                    <div className="text-sm text-gray-600">Suggest new features</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
