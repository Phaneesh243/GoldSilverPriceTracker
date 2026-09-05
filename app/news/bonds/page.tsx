import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Bonds news", "Latest India government securities, RBI yield, treasury and fixed-income market news.", "bonds");
export default function Page() { return <NewsCategoryPage title="Bonds news" description="Latest India government securities, RBI yield, treasury and fixed-income market news." category="bonds" />; }
