import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { CanvasEditor } from '@/components/canvas-editor';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import LandingPage from '@/pages/landing';
import EditorPage from '@/pages/editor';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/canvas">
        <CanvasEditor />
      </Route>
      <Route path="/editor" component={EditorPage} />
      <Route>404 Not Found</Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
