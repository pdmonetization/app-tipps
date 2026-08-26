import topicClusters from '../data/topic-clusters.json';

export type TopicCluster = {
  key: string;
  name: string;
  title: string;
  description: string;
  members: Array<{ slug: string; label: string }>;
};

const clusters = Object.entries(topicClusters) as Array<[
  string,
  Omit<TopicCluster, 'key'>,
]>;

const clusterBySlug = new Map(
  clusters.flatMap(([key, cluster]) =>
    cluster.members.map(({ slug }) => [slug, { key, ...cluster }] as const),
  ),
);

export function topicClusterForSlug(slug: string): TopicCluster | undefined {
  return clusterBySlug.get(slug);
}

export function allTopicClusters(): TopicCluster[] {
  return clusters.map(([key, cluster]) => ({ key, ...cluster }));
}
