import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/reviews')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/reviews"!</div>
}
