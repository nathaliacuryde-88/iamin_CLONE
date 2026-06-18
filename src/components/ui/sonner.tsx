import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={4500}
      // Push well below iOS dynamic island / status bar
      offset={`calc(env(safe-area-inset-top) + 56px)` as any}
      mobileOffset={`calc(env(safe-area-inset-top) + 56px)` as any}
      // Swipe UP to dismiss — feels natural for top banners.
      swipeDirections={["top"]}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full flex justify-center",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
