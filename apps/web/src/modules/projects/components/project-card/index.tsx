import { FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    repositoryUrl: string;
    authMethod: string;
    updatedAt: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <FolderGit2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{project.name}</CardTitle>
          {project.authMethod !== 'NONE' && (
            <Badge variant="outline" className="ml-auto text-xs">
              {project.authMethod}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {project.repositoryUrl}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
