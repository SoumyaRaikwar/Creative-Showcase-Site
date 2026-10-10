import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

const Work = lazy(() => import("@/pages/Work"));
const Writing = lazy(() => import("@/pages/Writing"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));

let navigated = false;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function ScrollManager() {
  const [location] = useLocation();
  useEffect(() => {
    if (!navigated) {
      navigated = true;
      return;
    }
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [location]);
  return null;
}

export default function App({ ssrPath }: { ssrPath?: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")} ssrPath={ssrPath}>
        <ScrollManager />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] btn btn-primary"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">
          <Suspense fallback={<div className="min-h-[60svh]" aria-busy="true" />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/work" component={Work} />
              <Route path="/writing" component={Writing} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug">{(params) => <BlogPost slug={params.slug} />}</Route>
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </WouterRouter>
    </QueryClientProvider>
  );
}
