package io.github.seopsci.forestschool;

import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 3.2.3: Play 권장 조치. Android 15 아래에서도 15 이상처럼 화면 끝까지 그려요(시스템 막대 여백은 Capacitor SystemBars가 맞춰요)
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        // 태블릿 맞춤: 게임이 정한 화면 너비(viewport)를 따라 화면 전체를 키울 수 있게 한다.
        // 2.1.20: 휴대폰에서 켜면 화면 전체가 작게 줄어들어서(지섭 제보), 짧은 쪽이 600dp 이상인 태블릿에서만 켠다.
        // 휴대폰은 2.1.0 때처럼 기본값 그대로 둔다
        // 3.2.1: 짧은 쪽이 440dp보다 넓은 휴대폰(화면 크기를 작게 한 기기 등)은 게임이 가운데에 작게 보여서, 이때도 켜고 게임이 412칸 너비로 그리게 한다
        if (getResources().getConfiguration().smallestScreenWidthDp > 440) {
            WebSettings s = getBridge().getWebView().getSettings();
            s.setUseWideViewPort(true);
            s.setLoadWithOverviewMode(true);
        }
    }
}
