import { Tag } from 'antd';
import { shortRank } from '../utils/analytics';

interface RankTagProps {
  rank: string;
}

export function RankTag({ rank }: RankTagProps) {
  const display = shortRank(rank);
  const colorClass = display === 'II' ? 'rank-tag rank-tag--gold' : 'rank-tag';
  return <Tag className={colorClass}>{display}</Tag>;
}
