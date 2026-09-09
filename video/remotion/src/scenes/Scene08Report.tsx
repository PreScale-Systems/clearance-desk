import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';
import {Kicker} from '../components/overlays';
import {PanViewport, Ring} from '../components/PanViewport';
import {BrowserFrame} from '../components/BrowserFrame';

// Scene 08 — the exportable report.
//   "When it finishes, export the report. An attorney-style memo up top, then
//    every item with its verdict, evidence, and reasoning. Ready for the lawyer
//    who signs."
//
// Beat 1: done-overview.png pushed toward the real "Export report" button, with a
//         click pulse. Beat 2: the exported report.md as a slow-scrolling document.
//
// DEVIATION (noted for the lead): report.png is 11px monospace across the full
// 1920 — unreadable at any crop that keeps whole lines. The document below is set
// in the design system and its text is transcribed verbatim from that screenshot
// (job 6b1b3eacd1dd), so nothing here is invented.
const CUT = 62; // ~2.1s — after "export the report."

const FRAME_LEFT = 116;
const FRAME_WIDTH = 1252;
const DOC_PAD = 50;
const BODY_HEIGHT = 828;

type Verdict = 'CONFLICT' | 'CAUTION' | 'CLEAR';

const ROWS: {
  risk: Verdict;
  element: string;
  category: string;
  scene: string;
  page: string;
  rec: string;
}[] = [
  {risk: 'CONFLICT', element: 'DANIEL REYES', category: 'person', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Change the name.'},
  {risk: 'CONFLICT', element: 'Dell', category: 'brand', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Obtain a license or release.'},
  {risk: 'CONFLICT', element: 'NORTHSTAR CONSULTING GROUP', category: 'business', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Change the name.'},
  {risk: 'CONFLICT', element: 'Sonos', category: 'brand', scene: "INT. DANIEL'S APARTMENT - SOUTH END - LATER", page: '1', rec: 'Obtain a license or change the brand.'},
  {risk: 'CONFLICT', element: 'Blue in Green', category: 'title', scene: "INT. DANIEL'S APARTMENT - SOUTH END - LATER", page: '1', rec: 'obtain a license or release'},
  {risk: 'CONFLICT', element: 'Sam Adams', category: 'brand', scene: "INT. DANIEL'S APARTMENT - SOUTH END - LATER", page: '1', rec: "Obtain a license from The Boston Beer Company to use the 'Sam Adams' brand, or change the brand of beer to a generic or fictional one."},
  {risk: 'CONFLICT', element: 'THE BANSHEE PUB', category: 'business', scene: 'INT. THE BANSHEE PUB - DORCHESTER - NIGHT', page: '1', rec: 'Obtain a license or release'},
  {risk: 'CONFLICT', element: 'Bruins', category: 'organization', scene: 'INT. THE BANSHEE PUB - DORCHESTER - NIGHT', page: '1', rec: 'Obtain a license or release from the Boston Bruins and/or the NHL, or change the team name to a fictional one and avoid showing specific team branding.'},
  {risk: 'CONFLICT', element: 'LENA OKAFOR', category: 'person', scene: 'INT. THE BANSHEE PUB - DORCHESTER - NIGHT', page: '1', rec: "Change the character's name and/or the newspaper she works for to avoid association with the real-life Lena Bruce."},
  {risk: 'CONFLICT', element: 'BOSTON HERALD', category: 'organization', scene: 'INT. THE BANSHEE PUB - DORCHESTER - NIGHT', page: '1', rec: 'Obtain a license or release from the Boston Herald for its use in the script.'},
  {risk: 'CONFLICT', element: 'State Street', category: 'location', scene: 'EXT. STATE STREET - DAY', page: '2', rec: 'Change the street name to avoid association with the financial institution.'},
  {risk: 'CONFLICT', element: 'UPS Store', category: 'business', scene: 'EXT. STATE STREET - DAY', page: '2', rec: 'Change the business name to a fictional entity.'},
  {risk: 'CONFLICT', element: 'Cadillac Escalade', category: 'brand', scene: 'EXT. STATE STREET - DAY', page: '2', rec: 'Change the brand or obtain a license/release from General Motors/Cadillac.'},
  {risk: 'CONFLICT', element: 'Boston PD', category: 'organization', scene: 'EXT. STATE STREET - DAY', page: '2', rec: 'Change the name to a fictional police department or obtain a release from the Boston Police Department.'},
  {risk: 'CONFLICT', element: 'Rothko', category: 'title', scene: "INT. HALVORSEN & PRICE LLP - MARGARET'S OFFICE - DAY", page: '3', rec: 'Obtain a license or release from the Mark Rothko estate or replace the artwork with a generic or public domain piece.'},
  {risk: 'CONFLICT', element: 'CAROLINE MERCER', category: 'person', scene: "INT. DANIEL'S APARTMENT - NIGHT", page: '3', rec: "Change the character's name."},
  {risk: 'CAUTION', element: 'HALVORSEN & PRICE LLP', category: 'business', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Change the name of the law firm to avoid phonetic similarity with a real Boston law firm, especially given the negative portrayal.'},
  {risk: 'CAUTION', element: 'MARGARET HALVORSEN', category: 'person', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Change the name to avoid any potential for confusion or perceived association.'},
  {risk: 'CAUTION', element: 'MacBook', category: 'brand', scene: "INT. DANIEL'S APARTMENT - SOUTH END - LATER", page: '1', rec: "Change to a generic term like 'laptop' or 'notebook computer,' or use a fictional brand name."},
  {risk: 'CAUTION', element: 'iPhone', category: 'brand', scene: 'EXT. STATE STREET - DAY', page: '2', rec: "Keep, but be aware of potential trademark owner concerns. Consider changing to a generic term like 'smartphone' or 'his phone' if avoiding all brand mentions is preferred."},
  {risk: 'CAUTION', element: 'FedEx', category: 'brand', scene: 'EXT. HARBOR TOWER - LOADING DOCK - NIGHT', page: '3', rec: 'Obtain a license or change the brand name.'},
  {risk: 'CLEAR', element: 'Boston Harbor', category: 'location', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Keep.'},
  {risk: 'CLEAR', element: "Dunkin'", category: 'brand', scene: 'INT. HALVORSEN & PRICE LLP - CONFERENCE ROOM - NIGHT', page: '1', rec: 'Keep.'},
  {risk: 'CLEAR', element: 'Tremont Street', category: 'location', scene: "INT. DANIEL'S APARTMENT - SOUTH END - LATER", page: '1', rec: 'Keep'},
  {risk: 'CLEAR', element: 'PATRICK WHITCOMBE', category: 'person', scene: "INT. HALVORSEN & PRICE LLP - DANIEL'S OFFICE - DAY", page: '2', rec: 'Keep.'},
  {risk: 'CLEAR', element: 'SUFFOLK COUNTY REGISTRY OF DEEDS', category: 'organization', scene: "INT. LENA'S CAR - NIGHT", page: '2', rec: 'Keep'},
];

const RISK_COLOR: Record<Verdict, string> = {
  CONFLICT: theme.colors.conflict,
  CAUTION: theme.colors.caution,
  CLEAR: theme.colors.clear,
};

const COL = {risk: 122, element: 250, category: 108, scene: 288};

const Note: React.FC<{appearAt: number; children: React.ReactNode}> = ({
  appearAt,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [appearAt, appearAt + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Scene08Report: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'}
  );

  // ---------------- Beat 1: the export click ----------------
  if (frame < CUT) {
    const click = interpolate(frame, [40, 56], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill style={{backgroundColor: theme.colors.bg, opacity: fadeIn}}>
        <PanViewport
          w={1920}
          h={1080}
          from={{x: 960, y: 540, zoom: 1.0}}
          to={{x: 1480, y: 300, zoom: 1.42}}
          endFrame={CUT}
        >
          <Img
            src={staticFile('assets/done-overview.png')}
            style={{width: 1920, height: 1080}}
          />
          <Ring
            x={1682}
            y={12}
            w={124}
            h={40}
            color={theme.colors.text}
            appearAt={14}
          />
          {/* click pulse on the real Export report button */}
          <div
            style={{
              position: 'absolute',
              left: 1744 - 44,
              top: 32 - 44,
              width: 88,
              height: 88,
              borderRadius: 44,
              border: `2px solid ${theme.colors.text}`,
              opacity: (1 - click) * (click > 0 ? 1 : 0),
              transform: `scale(${0.35 + click * 0.9})`,
            }}
          />
        </PanViewport>
      </AbsoluteFill>
    );
  }

  // ---------------- Beat 2: the exported report ----------------
  const local = frame - CUT;
  const scroll = interpolate(
    local,
    [0, 46, 96, 150, 214, 240],
    [0, 0, -180, -700, -1080, -1160],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );
  const enter = spring({frame: local, fps, config: {damping: 200}});
  const docOpacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{backgroundColor: theme.colors.bg, opacity: fadeIn * fadeOut}}
    >
      <div
        style={{
          position: 'absolute',
          left: FRAME_LEFT,
          top: 112,
          opacity: docOpacity,
          transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
        }}
      >
        <BrowserFrame width={FRAME_WIDTH}>
          <div
            style={{
              height: BODY_HEIGHT,
              backgroundColor: '#101218',
              borderTop: `1px solid ${theme.colors.hairline}`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: FRAME_WIDTH,
                padding: DOC_PAD,
                boxSizing: 'border-box',
                transform: `translateY(${scroll}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.serif,
                  fontSize: 40,
                  fontWeight: 700,
                  color: theme.colors.text,
                }}
              >
                Script clearance report &mdash; THE LEDGER
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: theme.fonts.mono,
                  fontSize: 17,
                  color: theme.colors.textDim,
                }}
              >
                Draft the_ledger_v1.fountain &nbsp;·&nbsp; Job 6b1b3eacd1dd
                &nbsp;·&nbsp; Fingerprint 3f688ebab998dc17
              </div>

              <div
                style={{
                  height: 1,
                  backgroundColor: theme.colors.hairline,
                  margin: '26px 0',
                }}
              />

              <div
                style={{
                  fontFamily: theme.fonts.sans,
                  fontSize: 20,
                  lineHeight: 1.6,
                  color: theme.colors.text,
                }}
              >
                <span style={{fontWeight: 600}}>Logline. </span>A junior law
                partner, discovering his firm is helping a client launder money,
                teams up with an investigative reporter to expose the crime,
                risking his career and safety.
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: theme.fonts.sans,
                  fontSize: 20,
                  lineHeight: 1.6,
                  color: theme.colors.text,
                }}
              >
                <span style={{fontWeight: 600}}>Setting. </span>Contemporary
                Boston, Massachusetts
              </div>

              <div
                style={{
                  marginTop: 34,
                  fontFamily: theme.fonts.serif,
                  fontSize: 28,
                  fontWeight: 600,
                  color: theme.colors.text,
                }}
              >
                Summary
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: theme.fonts.sans,
                  fontSize: 20,
                  lineHeight: 1.68,
                  color: 'rgba(244, 241, 234, 0.82)',
                }}
              >
                This report for &lsquo;THE LEDGER&rsquo; identifies significant
                clearance risks requiring your immediate attention before the
                shooting script is locked. The overall exposure is high due to
                numerous conflicts with real-world individuals, businesses, and
                organizations, many of which are portrayed negatively. It is
                imperative to change the names of the main characters, including
                DANIEL REYES, LENA OKAFOR, and CAROLINE MERCER, as they conflict
                with real people. The fictional businesses NORTHSTAR CONSULTING
                GROUP and FIRST MERIDIAN BANK must also be renamed to avoid
                confusion with existing companies. Licenses or releases are
                required for all branded products (Dell, Sonos, Cadillac
                Escalade, Macallan 18), the Bruins team, the song Blue in Green,
                and the Rothko artwork.
              </div>

              <div
                style={{
                  marginTop: 40,
                  fontFamily: theme.fonts.serif,
                  fontSize: 28,
                  fontWeight: 600,
                  color: theme.colors.text,
                }}
              >
                Items
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 18,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${theme.colors.hairline}`,
                  fontFamily: theme.fonts.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: theme.colors.textDim,
                }}
              >
                <div style={{width: COL.risk}}>Risk</div>
                <div style={{width: COL.element}}>Element</div>
                <div style={{width: COL.category}}>Category</div>
                <div style={{width: COL.scene}}>Scene · Page</div>
                <div style={{flex: 1}}>Recommendation</div>
              </div>

              {ROWS.map((r) => (
                <div
                  key={`${r.element}-${r.scene}`}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    padding: '14px 0',
                    borderBottom: `1px solid rgba(244,241,234,0.06)`,
                  }}
                >
                  <div style={{width: COL.risk}}>
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        color: RISK_COLOR[r.risk],
                        border: `1px solid ${RISK_COLOR[r.risk]}`,
                        borderRadius: 999,
                        padding: '4px 12px',
                      }}
                    >
                      {r.risk}
                    </span>
                  </div>
                  <div
                    style={{
                      width: COL.element,
                      fontFamily: theme.fonts.mono,
                      fontSize: 18,
                      color: theme.colors.text,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.element}
                  </div>
                  <div
                    style={{
                      width: COL.category,
                      fontFamily: theme.fonts.sans,
                      fontSize: 17,
                      color: theme.colors.textDim,
                    }}
                  >
                    {r.category}
                  </div>
                  <div
                    style={{
                      width: COL.scene,
                      fontFamily: theme.fonts.sans,
                      fontSize: 14,
                      lineHeight: 1.45,
                      color: theme.colors.textDim,
                    }}
                  >
                    {r.scene} · p.{r.page}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontFamily: theme.fonts.sans,
                      fontSize: 16,
                      lineHeight: 1.5,
                      color: 'rgba(244, 241, 234, 0.78)',
                    }}
                  >
                    {r.rec}
                  </div>
                </div>
              ))}
            </div>

            {/* top/bottom feather so the scroll reads as a document, not a slide */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(to bottom, rgba(16,18,24,0.96) 0px, rgba(16,18,24,0) 60px, rgba(16,18,24,0) calc(100% - 70px), rgba(16,18,24,0.96) 100%)',
              }}
            />
          </div>
        </BrowserFrame>
      </div>

      {/* caption column in the right margin */}
      <div
        style={{
          position: 'absolute',
          left: FRAME_LEFT + FRAME_WIDTH + 62,
          top: 178,
          width: 424,
        }}
      >
        <Note appearAt={CUT + 4}>
          <Kicker style={{fontSize: 17}}>export</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: theme.fonts.mono,
              fontSize: 19,
              lineHeight: 1.5,
              color: theme.colors.text,
              wordBreak: 'break-all',
            }}
          >
            /api/jobs/6b1b3eacd1dd/report.md
          </div>
        </Note>

        <div
          style={{
            height: 1,
            backgroundColor: theme.colors.hairline,
            margin: '34px 0',
          }}
        />

        <Note appearAt={CUT + 22}>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.4,
              color: theme.colors.text,
            }}
          >
            Attorney-style memo
            <br />
            up top
          </div>
        </Note>

        <div style={{height: 40}} />

        <Note appearAt={CUT + 104}>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.4,
              color: theme.colors.text,
            }}
          >
            Then every item &mdash;
            <br />
            verdict, evidence,
            <br />
            reasoning
          </div>
        </Note>

        <div style={{height: 56}} />

        <Note appearAt={CUT + 178}>
          <div
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 38,
              fontWeight: 600,
              lineHeight: 1.25,
              color: theme.colors.text,
            }}
          >
            Ready for the lawyer who signs.
          </div>
        </Note>
      </div>
    </AbsoluteFill>
  );
};
