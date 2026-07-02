import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Storefront from "./pages/storefront";
import Cart from "./pages/cart";
import Admin from "./pages/admin";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Storefront} />
        <Route path="/cart" component={Cart} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </QueryClientProvider>
  );
}
