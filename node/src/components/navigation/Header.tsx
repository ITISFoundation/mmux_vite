import { HelpOutline, InfoOutline } from "@mui/icons-material";
import { Typography, styled } from "@mui/material";
import CustomTooltip from "../CustomTooltip";

const HeaderContainer = styled("div", {
  shouldForwardProp: (props) => props !== "headerType",
})<{ headerType: string }>(
  ({ headerType }) => `
  text-align: left;
  margin-bottom: ${headerType !== "bigTitle" && headerType !== 'titleNoMargin' ? "16px" : "0px"};
  display: flex;
  align-items: flex-end;
  width: 100%;
`);

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "caption" | "button" | "overline" | "inherit";

const types: { [key in HeaderTypes]: TypographyVariant } = {
  subTitle: "h6",
  bigTitle: "h4",
  title: "h5",
  titleNoMargin: "h5",
}

function Header(props: HeaderProps) {
  const { tabTitle, infoText, ExtendedInfoText, headerType, helpContents } = props;

  return (
    <div style={{ display: "flex" }}>
      <HeaderContainer headerType={headerType}>
        <Typography
          variant={types[headerType]}
          component="h1"
          fontWeight={headerType === "subTitle" ? 100 : 200}
          fontFamily={"inherit"}
        >
          {tabTitle}
        </Typography>
        {infoText && infoText.length > 0 && (
          <CustomTooltip title={infoText} ExtendedTootlip={ExtendedInfoText} placement="right" arrow>
            <InfoOutline
              sx={(theme) => ({
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.grey[100],
                borderRadius: "50%",
                padding: "2px",
                marginLeft: "8px",
                marginBottom: "2px",
                fontSize: "24px"
              })}
            />
          </CustomTooltip>
        )}
      </HeaderContainer>

      {(helpContents &&
        <CustomTooltip title={helpContents} placement="right" arrow>
          <HelpOutline
            sx={(theme) => ({
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.grey[100],
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "8px",
              marginRight: "4px",
              fontSize: "32px"
            })}
          />
        </CustomTooltip>
      )}
    </div>
  )
}

export default Header;
