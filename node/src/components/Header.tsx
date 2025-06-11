import { InfoOutline } from "@mui/icons-material";
import { Typography, styled } from "@mui/material";
import CustomTooltip from "./CustomTooltip";

const HeaderContainer = styled("div", {
  shouldForwardProp: (props) => props !== "headerType",
})<{ headerType: string }>(
  ({ headerType }) => `
  text-align: left;
  margin-bottom: ${headerType === "subTitle" ? "16px" : "0px"};
  display: flex;
  align-items: center;
  width: 100%;
`);

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "caption" | "button" | "overline" | "inherit";

const types:{[key in HeaderTypes]: TypographyVariant} = {
  subTitle: "h6",
  setup: "h5",
  sumo: "h4",
  uq: "h5",
}

function Header(props: HeaderProps) {
  const { tabTitle, infoText, headerType } = props;
  return (
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
        <CustomTooltip title={infoText} placement="right" arrow>
          <InfoOutline
            sx={(theme) => ({
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.grey[100],
              borderRadius: "50%",
              padding: "2px",
              marginLeft: "8px",
            })}
          />
        </CustomTooltip>
      )}
    </HeaderContainer>
  );
}

export default Header;
