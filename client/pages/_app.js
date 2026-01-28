import "bootstrap/dist/css/bootstrap.css";
import buildClient from "../api/build-client";
import HeaderComponent from "../components/header";

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <div>
      <HeaderComponent currentUser={currentUser} />
      <div className="container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
    </div>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  const client = buildClient(appContext.ctx);

  try {
    const { data } = await client.get("/api/users/currentuser");

    let pageProps = {};
    if (appContext.Component.getInitialProps) {
      pageProps = await appContext.Component.getInitialProps(
        appContext.ctx,
        client,
        data.currentUser,
      );
    }

    console.log(pageProps);
    return {
      pageProps,
      ...data,
    };
  } catch (error) {}

  return {};
};

export default AppComponent;
