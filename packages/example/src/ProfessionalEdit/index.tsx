import {loadFont} from '@remotion/google-fonts/Montserrat';
import {Video} from '@remotion/media';
import {
	linearTiming,
	springTiming,
	TransitionSeries,
	type TransitionPresentation,
} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import React from 'react';
import {
	AbsoluteFill,
	CalculateMetadataFunction,
	Easing,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
	weights: ['600', '800'],
	subsets: ['latin'],
});

const FPS = 30;
const INTRO_FRAMES = 45;
const OUTRO_FRAMES = 60;
const TRANSITION_FRAMES = 12;

const illustrationSchema = z.enum([
	'none',
	'arrow',
	'check',
	'lightbulb',
	'chart',
	'heart',
	'star',
]);

export const professionalEditSchema = z.object({
	videoSrc: z.string(),
	title: z.string(),
	subtitle: z.string(),
	outroText: z.string(),
	accentColor: z.string(),
	cuts: z.array(
		z.object({
			startSeconds: z.number().min(0),
			endSeconds: z.number().min(0),
			caption: z.string(),
			illustration: illustrationSchema,
			zoom: z.boolean(),
		}),
	),
});

type Props = z.infer<typeof professionalEditSchema>;
type Illustration = z.infer<typeof illustrationSchema>;

export const professionalEditDefaultProps: Props = {
	// Substitua pelo seu vídeo em packages/example/public/
	videoSrc: 'zero-timestamp.mp4',
	title: 'Seu Título Aqui',
	subtitle: 'Edição profissional',
	outroText: 'Siga para mais!',
	accentColor: '#FFD43B',
	cuts: [
		{
			startSeconds: 0,
			endSeconds: 2.5,
			caption: 'Comece com um gancho forte',
			illustration: 'lightbulb',
			zoom: true,
		},
		{
			startSeconds: 4,
			endSeconds: 6.5,
			caption: 'Corte o que não agrega',
			illustration: 'arrow',
			zoom: false,
		},
		{
			startSeconds: 8,
			endSeconds: 10.5,
			caption: 'Mostre os resultados',
			illustration: 'chart',
			zoom: true,
		},
		{
			startSeconds: 12,
			endSeconds: 14.5,
			caption: 'Feche com chave de ouro',
			illustration: 'check',
			zoom: false,
		},
	],
};

const cutFrames = (cut: Props['cuts'][number]) =>
	Math.max(1, Math.round((cut.endSeconds - cut.startSeconds) * FPS));

export const calculateProfessionalEditMetadata: CalculateMetadataFunction<
	Props
> = ({props}) => {
	const cutsTotal = props.cuts.reduce((acc, c) => acc + cutFrames(c), 0);
	// Every transition overlaps two neighbouring scenes.
	const transitions = (props.cuts.length + 1) * TRANSITION_FRAMES;
	return {
		durationInFrames: INTRO_FRAMES + cutsTotal + OUTRO_FRAMES - transitions,
		fps: FPS,
	};
};

const srcOf = (src: string) => (src.startsWith('http') ? src : staticFile(src));

const IllustrationSvg: React.FC<{
	readonly type: Illustration;
	readonly color: string;
}> = ({type, color}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (type === 'none') {
		return null;
	}

	const pop = spring({frame: frame - 6, fps, config: {damping: 12}});
	const draw = interpolate(frame, [6, 30], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const float = Math.sin(frame / 12) * 6;
	const stroke = {
		fill: 'none',
		stroke: color,
		strokeWidth: 10,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		pathLength: 1,
		strokeDasharray: 1,
		strokeDashoffset: draw,
	};

	const paths: Record<Exclude<Illustration, 'none'>, React.ReactNode> = {
		arrow: (
			<>
				<path d="M30 150 C 70 60, 130 60, 170 100" {...stroke} />
				<path d="M140 70 L 172 102 L 130 115" {...stroke} />
			</>
		),
		check: (
			<>
				<circle cx="100" cy="100" r="80" {...stroke} />
				<path d="M60 102 L 88 130 L 142 72" {...stroke} />
			</>
		),
		lightbulb: (
			<>
				<path
					d="M70 130 C 40 105, 45 40, 100 38 C 155 40, 160 105, 130 130 L 128 150 L 72 150 Z"
					{...stroke}
				/>
				<path d="M78 168 L 122 168" {...stroke} />
				<path
					d="M100 8 L 100 20 M 30 40 L 40 48 M 170 40 L 160 48"
					{...stroke}
				/>
			</>
		),
		chart: (
			<>
				<path d="M25 175 L 175 175" {...stroke} />
				<path
					d="M50 175 L 50 130 M 90 175 L 90 100 M 130 175 L 130 60"
					{...stroke}
				/>
				<path
					d="M40 110 L 85 75 L 115 90 L 170 30 M 145 30 L 170 30 L 170 55"
					{...stroke}
				/>
			</>
		),
		heart: (
			<path
				d="M100 170 C 20 115, 25 40, 70 40 C 90 40, 100 55, 100 65 C 100 55, 110 40, 130 40 C 175 40, 180 115, 100 170 Z"
				{...stroke}
			/>
		),
		star: (
			<path
				d="M100 20 L 122 75 L 180 78 L 135 115 L 150 172 L 100 140 L 50 172 L 65 115 L 20 78 L 78 75 Z"
				{...stroke}
			/>
		),
	};

	return (
		<svg
			viewBox="0 0 200 200"
			width={260}
			height={260}
			style={{
				position: 'absolute',
				top: 260,
				right: 70,
				transform: `translateY(${float}px) scale(${pop}) rotate(${(1 - pop) * -20}deg)`,
				filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))',
			}}
		>
			{paths[type]}
		</svg>
	);
};

const Caption: React.FC<{readonly text: string; readonly color: string}> = ({
	text,
	color,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');
	return (
		<div
			style={{
				position: 'absolute',
				left: 60,
				right: 60,
				bottom: 380,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap: '0 22px',
				fontFamily,
				fontWeight: 800,
				fontSize: 84,
				lineHeight: 1.15,
				textAlign: 'center',
				textTransform: 'uppercase',
				WebkitTextStroke: '14px black',
				paintOrder: 'stroke',
				textShadow: '0 10px 30px rgba(0,0,0,0.6)',
			}}
		>
			{words.map((word, i) => {
				const delay = 4 + i * 4;
				const s = spring({frame: frame - delay, fps, config: {damping: 14}});
				const active = frame >= delay && frame < delay + 10;
				return (
					<span
						key={i}
						style={{
							color: active ? color : 'white',
							opacity: s,
							transform: `translateY(${(1 - s) * 40}px) scale(${0.8 + s * 0.2})`,
							display: 'inline-block',
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};

const CutScene: React.FC<{
	readonly cut: Props['cuts'][number];
	readonly videoSrc: string;
	readonly accentColor: string;
}> = ({cut, videoSrc, accentColor}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	// Subtle Ken Burns push-in, with a punch-in on "zoom" cuts
	const scale = cut.zoom
		? interpolate(frame, [0, 8, durationInFrames], [1.0, 1.18, 1.24], {
				extrapolateRight: 'clamp',
				easing: Easing.out(Easing.cubic),
			})
		: interpolate(frame, [0, durationInFrames], [1.04, 1.1]);

	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<AbsoluteFill style={{transform: `scale(${scale})`}}>
				<Video
					src={srcOf(videoSrc)}
					trimBefore={Math.round(cut.startSeconds * FPS)}
					objectFit="cover"
					style={{
						width: '100%',
						height: '100%',
						filter: 'contrast(1.08) saturate(1.15) brightness(1.02)',
					}}
				/>
			</AbsoluteFill>
			{/* Cinematic vignette + gradient for legibility */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%), linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.65) 100%)',
				}}
			/>
			<IllustrationSvg type={cut.illustration} color={accentColor} />
			<Caption text={cut.caption} color={accentColor} />
		</AbsoluteFill>
	);
};

const TitleCard: React.FC<{
	readonly title: string;
	readonly subtitle: string;
	readonly accentColor: string;
}> = ({title, subtitle, accentColor}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame, fps, config: {damping: 200}});
	const bar = spring({frame: frame - 8, fps, config: {damping: 200}});
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 30% 20%, #2b2b40, #0b0b12 70%)`,
				justifyContent: 'center',
				alignItems: 'center',
				fontFamily,
				color: 'white',
				padding: 80,
			}}
		>
			<div
				style={{
					fontSize: 120,
					fontWeight: 800,
					textAlign: 'center',
					lineHeight: 1.05,
					opacity: s,
					transform: `translateY(${(1 - s) * 60}px)`,
				}}
			>
				{title}
			</div>
			<div
				style={{
					width: 360 * bar,
					height: 14,
					borderRadius: 7,
					background: accentColor,
					margin: '40px 0',
				}}
			/>
			<div
				style={{
					fontSize: 54,
					fontWeight: 600,
					opacity: bar,
					color: accentColor,
				}}
			>
				{subtitle}
			</div>
		</AbsoluteFill>
	);
};

const ProgressBar: React.FC<{readonly color: string}> = ({color}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				bottom: 0,
				height: 12,
				width: `${(frame / (durationInFrames - 1)) * 100}%`,
				background: color,
			}}
		/>
	);
};

export const ProfessionalEdit: React.FC<Props> = ({
	videoSrc,
	title,
	subtitle,
	outroText,
	accentColor,
	cuts,
}) => {
	const presentations: TransitionPresentation<Record<string, unknown>>[] = [
		slide({direction: 'from-right'}),
		wipe({direction: 'from-bottom-left'}),
		fade(),
	] as TransitionPresentation<Record<string, unknown>>[];
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
					<TitleCard
						title={title}
						subtitle={subtitle}
						accentColor={accentColor}
					/>
				</TransitionSeries.Sequence>
				{cuts.map((cut, i) => (
					<React.Fragment key={i}>
						<TransitionSeries.Transition
							presentation={presentations[i % presentations.length]}
							timing={springTiming({
								config: {damping: 200},
								durationInFrames: TRANSITION_FRAMES,
							})}
						/>
						<TransitionSeries.Sequence durationInFrames={cutFrames(cut)}>
							<CutScene
								cut={cut}
								videoSrc={videoSrc}
								accentColor={accentColor}
							/>
						</TransitionSeries.Sequence>
					</React.Fragment>
				))}
				<TransitionSeries.Transition
					presentation={fade()}
					timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
				/>
				<TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
					<TitleCard
						title={outroText}
						subtitle={title}
						accentColor={accentColor}
					/>
				</TransitionSeries.Sequence>
			</TransitionSeries>
			<ProgressBar color={accentColor} />
		</AbsoluteFill>
	);
};
