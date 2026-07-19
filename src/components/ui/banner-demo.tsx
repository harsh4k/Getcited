import { Banner } from "@/components/ui/banner";

export default function BannerDemo() {
  return (
    <div className="w-full p-10">
      <Banner
        id="banner-id"
        variant="rainbow"
        className="bg-bg-primary shadow-lg dark:bg-transparent"
        rainbowColors={[
          "rgba(129,140,248,0.85)",
          "rgba(129,140,248,0.85)",
          "transparent",
          "rgba(165,180,252,0.75)",
          "transparent",
          "rgba(129,140,248,0.85)",
          "transparent",
        ]}
      >
        Project evolving — more features soon.
      </Banner>
    </div>
  );
}
