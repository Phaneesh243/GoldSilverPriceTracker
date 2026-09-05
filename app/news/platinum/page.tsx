import { categoryMetadata, default as NewsCategoryPage } from "../category-page";
export const metadata = categoryMetadata("Platinum news", "Latest platinum price news, automotive demand, jewellery and industrial market updates.", "platinum");
export default function Page() { return <NewsCategoryPage title="Platinum news" description="Latest platinum price news, automotive demand, jewellery and industrial market updates." metal="platinum" />; }
