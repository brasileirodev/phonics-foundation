import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { LessonDto, ProgressDto } from '@phonics/shared';
import { api, getSessionId } from './api';
import './i18n';
export default function App() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [progress, setProgress] = useState<ProgressDto | null>(null);
  const [session] = useState(getSessionId);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [simulated, setSimulated] = useState(false);
  useEffect(() => {
    document.documentElement.lang = i18n.language === 'pt' ? 'pt-BR' : 'en';
  }, [i18n.language]);
  useEffect(() => {
    let active = true;
    Promise.all([api.health(), api.lesson(), api.progress(session)])
      .then(([health, nextLesson, nextProgress]) => {
        if (health.status !== 'ok') throw new Error('API unavailable');
        if (active) {
          setLesson(nextLesson);
          setProgress(nextProgress);
          setStatus('success');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [attempt, session]);
  async function save(count: number) {
    setBusy(true);
    setActionError(false);
    try {
      setProgress(await api.save(session, count));
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  }
  async function evaluate() {
    setBusy(true);
    setActionError(false);
    try {
      const result = await api.evaluate();
      setSimulated(result.success && result.simulated);
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  }
  const completed = progress?.completedSteps ?? 0;
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        component="header"
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            letterSpacing: '-.04em',
            fontSize: { xs: 20, md: 25 },
          }}
        >
          {t('brand')}
          <Box component="span" sx={{ color: 'secondary.main' }}>
            {' '}
            ✳
          </Box>
        </Typography>
        <TextField
          select
          size="small"
          label={t('language')}
          value={i18n.language}
          onChange={(event) => void i18n.changeLanguage(event.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="pt">Português</MenuItem>
        </TextField>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Box
        component="main"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 8 },
          alignItems: 'center',
          py: { xs: 3, md: 8 },
        }}
      >
        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ letterSpacing: '.18em' }}
          >
            {t('eyebrow')}
          </Typography>
          <Typography
            component="h1"
            sx={{
              whiteSpace: 'pre-line',
              fontSize: { xs: 43, md: 62 },
              lineHeight: 1.08,
              letterSpacing: '-.055em',
              fontWeight: 750,
            }}
          >
            {t('title')}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 19, maxWidth: 380 }}
          >
            {t('intro')}
          </Typography>
          <Chip label={t('foundation')} variant="outlined" />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 390 }}
          >
            {t('note')}
          </Typography>
        </Stack>
        <Card
          variant="outlined"
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            boxShadow: '0 18px 60px #245b4b0d',
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="overline">{t('preview')}</Typography>
              <Chip size="small" label="PT-BR" />
            </Stack>
            {status === 'loading' && (
              <Stack
                role="status"
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center' }}
              >
                <CircularProgress size={20} />
                <Typography>{t('loading')}</Typography>
              </Stack>
            )}
            {status === 'error' && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    onClick={() => {
                      setStatus('loading');
                      setAttempt((value) => value + 1);
                    }}
                  >
                    {t('retry')}
                  </Button>
                }
              >
                {t('error')}
              </Alert>
            )}
            {status === 'success' && lesson && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'center',
                    py: 2,
                  }}
                >
                  {Array.from(lesson.word).map((letter, index) => (
                    <Box
                      key={index}
                      sx={{
                        bgcolor: index % 2 ? '#f3d7a2' : '#dce9dd',
                        borderRadius: 3,
                        width: { xs: 55, sm: 76 },
                        py: 2,
                        textAlign: 'center',
                        fontSize: { xs: 34, sm: 48 },
                        fontWeight: 750,
                      }}
                    >
                      {letter}
                    </Box>
                  ))}
                </Box>
                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {t('steps', { count: lesson.steps.length })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('journey')}
                  </Typography>
                </Stack>
                <Alert severity="success">{t('connected')}</Alert>
                <Divider />
                <Typography variant="body2">
                  {t('saved', { count: completed, total: lesson.steps.length })}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(completed / lesson.steps.length) * 100}
                  aria-label={t('saved', {
                    count: completed,
                    total: lesson.steps.length,
                  })}
                  sx={{ height: 7, borderRadius: 5 }}
                />
                <Button
                  variant="contained"
                  disabled={busy || completed >= lesson.steps.length}
                  onClick={() => void save(completed + 1)}
                >
                  {t('demo')}
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
                  <Button disabled={busy} onClick={() => void save(0)}>
                    {t('reset')}
                  </Button>
                  <Button disabled={busy} onClick={() => void evaluate()}>
                    {t('simulate')}
                  </Button>
                </Stack>
                {simulated && <Alert severity="info">{t('simulated')}</Alert>}
                {actionError && (
                  <Alert severity="error">{t('progressError')}</Alert>
                )}
                <Typography variant="caption" color="text.secondary">
                  {t('session')}
                </Typography>
              </>
            )}
          </Stack>
        </Card>
      </Box>
      <Divider />
      <Typography
        component="footer"
        variant="body2"
        color="text.secondary"
        sx={{ py: 3 }}
      >
        {t('footer')}
      </Typography>
    </Container>
  );
}
