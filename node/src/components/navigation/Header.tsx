import { HelpOutline, InfoOutline } from "@mui/icons-material";
import { Box, Typography, styled, useTheme } from "@mui/material";
import CustomTooltip from "../utils/CustomTooltip";

const HeaderContainer = styled("div", {
  shouldForwardProp: props => props !== "headerType",
})<{ headerType: HeaderTypes }>(
  ({ headerType, theme }) => `
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  text-align: left;
  padding: ${theme.spacing(2)};
  padding-left: ${headerType === "subTitle" ? theme.spacing(1) : theme.spacing(3)};
  border-radius: ${theme.shape.borderRadius}px;
  margin-bottom: ${headerType !== "bigTitle" && headerType !== "titleNoMargin" && headerType !== "subTitle" ? "16px" : "0px"};
  background-color: ${headerType === "subTitle" ? undefined : theme.palette.background.default};
`,
);

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "caption"
  | "button"
  | "overline"
  | "inherit";

const types: { [key in HeaderTypes]: TypographyVariant } = {
  subTitle: "h6",
  bigTitle: "h4",
  title: "h5",
  titleNoMargin: "h5",
};

function Header(props: HeaderProps) {
  const { tabTitle, infoText, ExtendedInfoText, headerType, helpContents, fontWeight, errorMessage } = props;
  const theme = useTheme();
  return (
    <HeaderContainer headerType={headerType}>
      <Box flex={1} display="flex" alignItems="center">
        <Typography
          variant={types[headerType]}
          component="h1"
          fontWeight={fontWeight || (headerType === "subTitle" ? 100 : 100)}
          fontFamily="inherit"
          mmux-testid="header-title"
        >
          {tabTitle}
        </Typography>
        {infoText && infoText.length > 0 && (
          <CustomTooltip title={infoText} ExtendedTooltip={ExtendedInfoText} placement="right" arrow>
            <InfoOutline
              sx={{
                color: theme.palette.primary.light,
                backgroundColor: theme.palette.background.default,
                borderRadius: "50%",
                padding: "2px",
                marginLeft: "8px",
                marginBottom: "2px",
                fontSize: "24px",
              }}
            />
          </CustomTooltip>
        )}
        {errorMessage && (
          <Typography color="error" sx={{ marginLeft: "16px", fontSize: "0.9em", fontWeight: 400 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>
      {helpContents && (
        <CustomTooltip title={helpContents} placement="right" arrow>
          <HelpOutline
            sx={{
              color: theme.palette.primary.light,
              backgroundColor: theme.palette.background.default,
              borderRadius: "50%",
              padding: "2px",
              fontSize: "32px",
            }}
          />
        </CustomTooltip>
      )}
    </HeaderContainer>
  );
}

export default Header;
