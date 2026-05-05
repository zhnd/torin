import { CheckTable } from '@/components/common/check-table';
import { Chip } from '@/components/common/chip';
import { Section, StageHeader } from '../parts';

export function FilterBody({ payload }: { payload: Record<string, unknown> }) {
  const checks = (payload.filterChecks ?? {}) as Record<
    string,
    { name?: string; passed?: boolean; output?: string }
  >;
  const checkList = Object.entries(checks).map(([key, v]) => ({
    name: v?.name ?? key,
    passed: Boolean(v?.passed),
    output: String(v?.output ?? ''),
  }));
  const passed = checkList.filter((c) => c.passed).length;
  const allPassed = passed === checkList.length && checkList.length > 0;

  return (
    <div>
      <StageHeader
        title="Automated filter"
        stage="filter"
        chips={[
          <Chip key="s" dot={allPassed ? 'var(--ok)' : 'var(--danger)'} strong>
            {allPassed ? 'All passed' : 'Failed'}
          </Chip>,
          <Chip key="c" mono>
            {passed}/{checkList.length} checks
          </Chip>,
        ]}
      />
      {checkList.length > 0 ? (
        <Section label="Checks">
          <CheckTable checks={checkList} />
        </Section>
      ) : (
        <div className="text-[12.5px] text-foreground-muted">
          No filter checks recorded.
        </div>
      )}
    </div>
  );
}
