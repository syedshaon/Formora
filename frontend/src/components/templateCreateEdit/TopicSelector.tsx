import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTopics } from "@/hooks/useTopics";
import { useTranslation } from "react-i18next";

type TopicSelectorProps = {
  value: string | null;
  onChange: (value: number) => void;
  className?: string;
};

export const TopicSelector = ({ value, onChange, className }: TopicSelectorProps) => {
  const {
    data: topicsData,
    isLoading,
    isError,
    error,
  } = useTopics({
    page: 1,
    limit: 5,
    sortBy: "name",
    sortOrder: "asc",
  });
  const { t } = useTranslation("common");
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="topic">{t("common.topicSelector.Topic *")}</Label>
      {isLoading ? (
        <Select disabled>
          <SelectTrigger id="topic" className="w-full">
            <SelectValue placeholder={t("common.topicSelector.Loading topics...")} />
          </SelectTrigger>
        </Select>
      ) : isError ? (
        <div className="text-sm text-red-500">
          {error?.message || t("common.topicSelector.Error loading topics")}
          <button onClick={() => window.location.reload()} className="ml-2 text-sm underline">
            {t("common.topicSelector.Retry")}
          </button>
        </div>
      ) : (
        <Select value={value?.toString() || ""} onValueChange={(val) => onChange(parseInt(val))}>
          <SelectTrigger id="topic" className="w-full">
            <SelectValue placeholder={t("common.topicSelector.Select a topic")} />
          </SelectTrigger>
          <SelectContent>
            {topicsData?.topics?.map((topic) => (
              <SelectItem key={topic.id} value={topic.id.toString()}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
