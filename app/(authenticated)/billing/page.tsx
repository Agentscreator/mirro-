"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Check,
  Crown,
  Zap,
  Star,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Subscription {
  id: string
  plan: "free" | "premium" | "pro"
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: "paid" | "pending" | "failed"
  date: string
  downloadUrl?: string
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Perfect for getting started",
    features: ["Basic profile", "Limited connections per day", "Standard matching", "Basic messaging"],
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    interval: "month",
    description: "Enhanced experience for serious connections",
    features: [
      "Enhanced profile features",
      "Unlimited connections",
      "Advanced matching algorithm",
      "Priority messaging",
      "See who liked you",
      "Advanced filters",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    interval: "month",
    description: "Maximum features for power users",
    features: [
      "Everything in Premium",
      "Super boost visibility",
      "Read receipts",
      "Advanced analytics",
      "Priority customer support",
      "Early access to new features",
    ],
    popular: false,
  },
]

export default function BillingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchBillingData()
    }
  }, [session])

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      // Fetch subscription data
      const subResponse = await fetch("/api/billing/subscription")
      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubscription(subData.subscription)
      }

      // Fetch invoices
      const invoicesResponse = await fetch("/api/billing/invoices")
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices || [])
      }
    } catch (error) {
      console.error("Error fetching billing data:", error)
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId)
    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Error upgrading plan:", error)
      toast({
        title: "Error",
        description: "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.",
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
      })

      if (response.ok) {
        await fetchBillingData()
        toast({
          title: "Subscription Canceled",
          description:
            "Your subscription has been canceled. You'll retain access until the end of your billing period.",
        })
      } else {
        throw new Error("Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const currentPlan = PLANS.find((plan) => plan.id === (subscription?.plan || "free"))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Plan & Billing</h1>
      </div>

      <div className="space-y-8">
        {/* Current Plan */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{currentPlan?.name || "Free"}</h3>
                  {subscription?.plan !== "free" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {subscription?.status === "active" ? "Active" : subscription?.status}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{currentPlan?.description}</p>

                {subscription && subscription.plan !== "free" && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {subscription.cancelAtPeriodEnd
                          ? `Expires on ${formatDate(subscription.currentPeriodEnd)}`
                          : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                      </span>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Subscription will not renew</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {subscription?.plan !== "free" && !subscription?.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                )}
                {subscription?.plan !== "pro" && (
                  <Button
                    onClick={() => handleUpgrade(subscription?.plan === "free" ? "premium" : "pro")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {subscription?.plan === "free" ? "Upgrade to Premium" : "Upgrade to Pro"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"} ${
                  subscription?.plan === plan.id ? "bg-blue-50 border-blue-300" : "bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-600">/{plan.interval}</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {subscription?.plan === plan.id ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading === plan.id || plan.id === "free"}
                      className={`w-full ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }`}
                    >
                      {upgrading === plan.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : null}
                      {plan.id === "free" ? "Current Plan" : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        {invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your recent invoices and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          invoice.status === "paid"
                            ? "bg-green-500"
                            : invoice.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{formatAmount(invoice.amount, invoice.currency)}</p>
                        <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {invoice.status}
                      </Badge>
                      {invoice.downloadUrl && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(invoice.downloadUrl, "_blank")}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-600">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
