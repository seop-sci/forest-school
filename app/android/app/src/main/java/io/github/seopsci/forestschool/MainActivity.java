package io.github.seopsci.forestschool;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 태블릿 맞춤: 게임이 정한 화면 너비(viewport)를 따라 화면 전체를 키울 수 있게 한다.
        // 2.1.20: 휴대폰에서 켜면 화면 전체가 작게 줄어들어서(지섭 제보), 짧은 쪽이 600dp 이상인 태블릿에서만 켠다.
        // 휴대폰은 2.1.0 때처럼 기본값 그대로 둔다
        if (getResources().getConfiguration().smallestScreenWidthDp >= 600) {
            WebSettings s = getBridge().getWebView().getSettings();
            s.setUseWideViewPort(true);
            s.setLoadWithOverviewMode(true);
        }
    }
}
