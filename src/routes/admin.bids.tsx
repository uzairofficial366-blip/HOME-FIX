import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/bids')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/bids"!</div>
}
