import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const trendingSkills = [
  { name: 'AI & Machine Learning', posts: 2340 },
  { name: 'Photography', posts: 1890 },
  { name: 'Guitar', posts: 1567 },
  { name: 'Web Development', posts: 1234 },
  { name: 'Spanish', posts: 987 },
  { name: 'Yoga', posts: 876 },
];

export function TrendingSkills() {
  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Trending Skills</h3>
      </div>
      <div className="space-y-3">
        {trendingSkills.map((skill, index) => (
          <div
            key={skill.name}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-5">
                #{index + 1}
              </span>
              <Badge variant="secondary">{skill.name}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {skill.posts.toLocaleString()} posts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
