import { View } from "react-native";

import { LoadingView } from "@/components/ui";
import colors from "@/constants/colors";

// The navigation guard in app/_layout.tsx redirects to the right group based
// on auth + onboarding state. This screen just shows a spinner while that
// resolves (and briefly on cold start).
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.light.background }}>
      <LoadingView />
    </View>
  );
}
